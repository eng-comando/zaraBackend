const express = require("express");
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.init);

router.post('/addproduct', productController.addProduct);
router.post('/removeproduct', productController.removeProduct);
router.get('/allproducts', productController.allProducts);
router.get('/newcollections', productController.newCollections);
router.get('/popularinwomen', productController.popularInWomen);
router.post('/relatedproducts', productController.relatedProducts);
router.post('/addtocart', productController.addToCart);
router.post('/removefromcart', productController.removeFromCart);
router.post('/getcart', productController.getCart);
router.put('/product/:productId', productController.updateProduct);
router.delete('/product/:productId', productController.deleteProduct);
router.get('/product/:productId', productController.getProductDetails);

module.exports = router
