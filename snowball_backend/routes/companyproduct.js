// companyProductRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('./pool'); // Your database connection

// ==================== 1. SELECT (Retrieve) API ====================
router.post("/retrieve-company-products", function (req, res, next) {
    try {
        const { companyproductid } = req.body;

        let query;
        let values = [];

        if (companyproductid) {
            // Get single product by ID
            query = `SELECT 
                companyproductid,
                icecreamname,
                entry_date,
                type,
                orderedqty,
                deliveredqty,
                (orderedqty - deliveredqty) as remainingqty,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM company_products WHERE companyproductid = ?`;
            values = [companyproductid];
        } else {
            // Get all products
            query = `SELECT 
                companyproductid,
                icecreamname,
                entry_date,
                type,
                orderedqty,
                deliveredqty,
                (orderedqty - deliveredqty) as remainingqty,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM company_products ORDER BY icecreamname`;
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
                if (companyproductid && result.length === 0) {
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
// Insert API with amount fields
router.post("/insert-company-product", function (req, res, next) {
    try {
        const { icecreamname, type, orderedqty, orderedamount, deliveredqty, deliveredamount } = req.body;

        if (!icecreamname || !type) {
            return res.status(400).json({
                status: false,
                message: "Ice cream name and type are required"
            });
        }

        const query = `INSERT INTO company_products 
        (icecreamname, type, orderedqty, orderedamount, deliveredqty, deliveredamount, entry_date, createdat, updatedat) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        const values = [
            icecreamname,
            type,
            orderedqty || 0,
            orderedamount || 0,
            deliveredqty || 0,
            deliveredamount || 0,
            req.body.entry_date || new Date().toISOString().split('T')[0]  // Add this line
        ];

        pool.query(query, values, function (error, result) {
            if (error) {
                console.log(error);
                res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: error.sqlMessage
                });
            } else {
                const selectQuery = `SELECT 
                    companyproductid,
                    icecreamname,
                    type,
                    orderedqty,
                    orderedamount,
                    deliveredqty,
                    deliveredamount,
                    (orderedqty - deliveredqty) as remainingqty,
                    DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                    DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                    FROM company_products WHERE companyproductid = ?`;

                pool.query(selectQuery, [result.insertId], function (err, insertedData) {
                    if (err) {
                        return res.status(200).json({
                            status: true,
                            message: "Product added successfully",
                            data: { companyproductid: result.insertId }
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
router.post("/update-company-product", function (req, res, next) {
    try {
        const { companyproductid, icecreamname, type, orderedqty, deliveredqty } = req.body;

        if (!companyproductid) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required"
            });
        }

        // Build dynamic update query
        let updateFields = [];
        let values = [];

        if (icecreamname !== undefined && icecreamname !== '') {
            updateFields.push('icecreamname = ?');
            values.push(icecreamname);
        }
        if (type !== undefined && type !== '') {
            updateFields.push('type = ?');
            values.push(type);
        }
        if (orderedqty !== undefined && orderedqty !== '') {
            updateFields.push('orderedqty = ?');
            values.push(orderedqty);
        }
        if (deliveredqty !== undefined && deliveredqty !== '') {
            updateFields.push('deliveredqty = ?');
            values.push(deliveredqty);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No fields to update"
            });
        }

        // Add updated timestamp
        updateFields.push('updatedat = NOW()');

        const query = `UPDATE company_products SET ${updateFields.join(', ')} WHERE companyproductid = ?`;
        values.push(companyproductid);

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
                    companyproductid,
                    icecreamname,
                    type,
                    orderedqty,
                    deliveredqty,
                    (orderedqty - deliveredqty) as remainingqty,
                    DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                    DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                    FROM company_products WHERE companyproductid = ?`;

                pool.query(selectQuery, [companyproductid], function (err, updatedData) {
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
router.post("/delete-company-product", function (req, res, next) {
    try {
        const { companyproductid } = req.body;

        if (!companyproductid) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required"
            });
        }

        // First get the product details before deletion
        const selectQuery = `SELECT 
            companyproductid,
            icecreamname,
            type,
            orderedqty,
            deliveredqty
            FROM company_products WHERE companyproductid = ?`;

        pool.query(selectQuery, [companyproductid], function (error, result) {
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
            const deleteQuery = "DELETE FROM company_products WHERE companyproductid = ?";

            pool.query(deleteQuery, [companyproductid], function (error, deleteResult) {
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