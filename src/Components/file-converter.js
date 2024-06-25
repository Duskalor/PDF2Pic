import { Download, RemoveRedEye } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import React, { useEffect, useMemo, useState } from 'react';
import Tesseract from 'tesseract.js';
var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/js/pdf.worker.js';

function FileConverter({ pdfUrl, fileName }) {
  const myRef = React.createRef();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [numOfPages, setNumOfPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [text, setText] = useState('');
  useEffect(() => {
    setLoading(false);
  }, [imageUrls]);

  useEffect(() => {
    if (value === 1) return;
    console.log(imageUrls);

    const extractText = (base64Image) => {
      Tesseract.recognize(
        base64Image,
        'eng', // Cambia el idioma según sea necesario
        {
          logger: (m) => console.log(m),
        }
      ).then(({ data: { text } }) => {
        setText(text);
      });
    };

    extractText(imageUrls[0]);
  }, [loading]);

  const handleClickOpen = (url, index) => {
    setSelectedImage({ url, index });
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setOpen(false);
  };

  const UrlUploader = (url) => {
    fetch(url).then((response) => {
      response.blob().then((blob) => {
        let reader = new FileReader();
        reader.onload = (e) => {
          const data = atob(e.target.result.replace(/.*base64,/, ''));
          renderPage(data);
        };
        reader.readAsDataURL(blob);
      });
    });
  };

  useMemo(() => {
    UrlUploader(pdfUrl);
  }, []);

  const renderPage = async (data) => {
    setLoading(true);
    const imagesList = [];
    const canvas = document.createElement('canvas');
    canvas.setAttribute('className', 'canv');
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    var page = await pdf.getPage(1);
    var viewport = page.getViewport({ scale: 4 });
    canvas.height = viewport.height / 5;
    canvas.width = viewport.width;
    var render_context = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport,
    };
    await page.render(render_context).promise;
    let img = canvas.toDataURL('image/png');
    imagesList.push(img);
    setNumOfPages((e) => e + pdf.numPages);
    setImageUrls((e) => [...e, ...imagesList]);
    setValue(2);
  };

  useEffect(() => {
    myRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [imageUrls]);

  const downloadImage = (url, index) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    handleClose();
  };

  return (
    <Box sx={{ my: 4, textAlign: 'center' }} ref={myRef} id='image-container'>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {imageUrls.length > 0 && (
            <>
              <h4 className='drop-file-preview__title'>
                Converted Images - {numOfPages}
              </h4>
              <Grid container spacing={3}>
                {imageUrls.map((url, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Box
                      sx={{ width: '100%', height: '250px' }}
                      className='img-card'
                    >
                      <img
                        src={url}
                        alt={`Page ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <Stack
                        direction='row'
                        spacing={1}
                        sx={{ position: 'absolute', top: 2, right: 2 }}
                      >
                        <IconButton
                          onClick={() => handleClickOpen(url, index)}
                          className='btn-bg'
                        >
                          <RemoveRedEye />
                        </IconButton>
                        <IconButton
                          onClick={() => downloadImage(url, index)}
                          className='btn-bg'
                        >
                          <Download />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
      <Dialog
        open={open}
        onClose={handleClose}
        scroll={'paper'}
        aria-labelledby='scroll-dialog-title'
        aria-describedby='scroll-dialog-description'
      >
        <DialogTitle id='scroll-dialog-title'>Preview</DialogTitle>
        <DialogContent dividers={true}>
          <img
            src={selectedImage?.url}
            alt={selectedImage?.url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant='outlined' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={() =>
              downloadImage(selectedImage.url, selectedImage.index)
            }
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
      <div>{text}</div>
    </Box>
  );
}

export default FileConverter;
