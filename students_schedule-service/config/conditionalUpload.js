import uploadMiddleware from './multerRessources.js';

const conditionalUpload = (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    //console.log('Content-Type:', contentType);

    // Check if the request is multipart/form-data
    if (contentType.startsWith('multipart/form-data')) {
        uploadMiddleware(req, res, next);
    } else {
        // If not multipart, skip Multer and proceed
        //console.log('Skipping Multer - not a multipart request');
        next();
    }
};

export default conditionalUpload;