const Product = require('../models/products');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-product', { 
    pageTitle: 'Add Product', 
    path: '/admin/add-product', 
    activeAddProduct: true,
    formsCSS: true,
    productCSS: true
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product(title, imageUrl, description, price);
  product.save();
  res.redirect('/');
};

exports.getProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('admin/products', { 
      prods: products, 
      pageTitle: 'Admin Products', 
      path: '/admin/products', 
    });
  });
};

exports.getEditProduct = (req, res, next) => {
  // req.body.title
  // res.render('admin/edit-product/:title', {
  //   prod: req.body.title
  // })
};

exports.deleteProduct = (req, res, next) => {

}