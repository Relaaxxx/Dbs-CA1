const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const productsModel = require('../models/products');

module.exports.retrieveById = function (req, res) {
    const code = req.params.code;

    return productsModel
        .retrieveById(code)
        .then(function (product) {
            return res.json({ product: product });
        })
        .catch(function (error) {
            console.error(error);
            if (error instanceof EMPTY_RESULT_ERROR) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        });
}


module.exports.retrieveAll = function (req, res) {
    const memberId = req.user.memberId;

    return productsModel
        .retrieveAll()
        .then(function (products) {
            return res.json({ products: products });
        })
        .catch(function (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        });
}