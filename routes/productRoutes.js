const express = require("express");
const router = express.Router();

const productController = require('../controllers/productController');

router.get('/', productController.init);

router.post('/addproduct', productController.addproduct);

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

router.get('/verifyToken', productController.verifyToken);

router.get('/popularAndNewCollectionIds', productController.popularAndNewCollectionIds);

router.post('/popular', productController.popular);

router.post('/newCollection', productController.newCollection);

router.post('/check-product', productController.checkProductExists);

router.get('/adminStats', productController.adminStats);

module.exports = router;