// productRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('./pool'); // Your database connection

// ==================== 1. SELECT (Retrieve) API ====================
router.post("/retrieve-products", function (req, res, next) {
    try {
        const { productid } = req.body;

        let query;
        let values = [];

        if (productid) {
            // Get single product by ID
            query = `SELECT 
                productid, 
                productname, 
                productprice,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM products WHERE productid = ?`;
            values = [productid];
        } else {
            // Get all products
            query = `SELECT 
                productid, 
                productname, 
                productprice,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM products ORDER BY productname`;
        }

        pool.query(query, values, function (error, result) {
            if (error) {
                console.log(error);
                res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: error.sqlMessage
                });
            } else {
                if (productid && result.length === 0) {
                    return res.status(404).json({
                        status: false,
                        message: "Product not found",
                        data: []
                    });
                }
                return res.status(200).json({
                    status: true,
                    message: "Success",
                    count: result.length,
                    data: result
                });
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 2. INSERT API ====================
router.post("/insert-product", function (req, res, next) {
    try {
        const { productname, productprice } = req.body;

        // Validate input
        if (!productname || !productprice) {
            return res.status(400).json({
                status: false,
                message: "Product name and price are required"
            });
        }

        const query = `INSERT INTO products (productname, productprice, createdat, updatedat) 
                       VALUES (?, ?, NOW(), NOW())`;
        const values = [productname, productprice];

        pool.query(query, values, function (error, result) {
            if (error) {
                console.log(error);
                res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: error.sqlMessage
                });
            } else {
                // Retrieve the inserted product
                const selectQuery = `SELECT 
                    productid, 
                    productname, 
                    productprice,
                    DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                    DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                    FROM products WHERE productid = ?`;

                pool.query(selectQuery, [result.insertId], function (err, insertedData) {
                    if (err) {
                        return res.status(200).json({
                            status: true,
                            message: "Product added successfully",
                            data: { productid: result.insertId }
                        });
                    }
                    return res.status(200).json({
                        status: true,
                        message: "Product added successfully",
                        data: insertedData[0]
                    });
                });
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 3. UPDATE API ====================
router.post("/update-product", function (req, res, next) {
    try {
        const { productid, productname, productprice } = req.body;

        if (!productid) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required"
            });
        }

        // Build dynamic update query
        let updateFields = [];
        let values = [];

        if (productname !== undefined && productname !== '') {
            updateFields.push('productname = ?');
            values.push(productname);
        }
        if (productprice !== undefined && productprice !== '') {
            updateFields.push('productprice = ?');
            values.push(productprice);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No fields to update"
            });
        }

        // Add updated timestamp
        updateFields.push('updatedat = NOW()');

        const query = `UPDATE products SET ${updateFields.join(', ')} WHERE productid = ?`;
        values.push(productid);

        pool.query(query, values, function (error, result) {
            if (error) {
                console.log(error);
                res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: error.sqlMessage
                });
            } else {
                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        status: false,
                        message: "Product not found"
                    });
                }

                // Retrieve the updated product
                const selectQuery = `SELECT 
                    productid, 
                    productname, 
                    productprice,
                    DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                    DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                    FROM products WHERE productid = ?`;

                pool.query(selectQuery, [productid], function (err, updatedData) {
                    if (err) {
                        return res.status(200).json({
                            status: true,
                            message: "Product updated successfully",
                            affectedRows: result.affectedRows
                        });
                    }
                    return res.status(200).json({
                        status: true,
                        message: "Product updated successfully",
                        affectedRows: result.affectedRows,
                        data: updatedData[0]
                    });
                });
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 4. DELETE API ====================
router.post("/delete-product", function (req, res, next) {
    try {
        const { productid } = req.body;

        if (!productid) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required"
            });
        }

        // First get the product details before deletion
        const selectQuery = `SELECT productid, productname, productprice FROM products WHERE productid = ?`;

        pool.query(selectQuery, [productid], function (error, result) {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: error.sqlMessage
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Product not found"
                });
            }

            const productData = result[0];

            // Delete the product
            const deleteQuery = "DELETE FROM products WHERE productid = ?";

            pool.query(deleteQuery, [productid], function (error, deleteResult) {
                if (error) {
                    console.log(error);
                    return res.status(500).json({
                        status: false,
                        message: "Database Error...",
                        error: error.sqlMessage
                    });
                }

                return res.status(200).json({
                    status: true,
                    message: "Product deleted successfully",
                    data: productData
                });
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

module.exports = router;