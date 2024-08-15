const express = require("express");
const router = express.Router();

const productController = require('../controllers/productController');

router.get('/', productController.init);

router.post('/addproduct', productController.addproduct);

router.post('/removeproduct', productController.removeproduct);

router.get('/allproducts', productController.allproducts);

router.get('/newcollections', productController.newcollections);

router.get('/popularinwomen', productController.popularinwomen);

router.post('/relatedproducts', productController.relatedproducts);

router.post('/addtocart', productController.addtocart);

router.post('/removefromcart', productController.removefromcart);

router.post('/getcart', productController.getcart);

router.put('/product/:productId', productController.updateProduct);

router.delete('/product/:productId', productController.deleteProduct);

router.get('/product/:productId', productController.getProductDetails);

module.exports = router;