const express = require('express');
const router = express.Router();
const pool = require('./pool');

// ==================== 1. SELECT (Retrieve) API ====================
router.post("/retrieve-shop-goods", function (req, res, next) {
    try {
        const { shopgoodsid, date, month, year } = req.body;

        let query;
        let values = [];

        if (shopgoodsid) {
            query = `SELECT 
                shopgoodsid,
                shopownerid,
                details,
                DATE_FORMAT(date, '%Y-%m-%d') as date,
                commission,
                finalamount,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM shop_goods 
                WHERE shopgoodsid = ?`;
            values = [shopgoodsid];
        } else if (date) {
            query = `SELECT 
                shopgoodsid,
                shopownerid,
                details,
                DATE_FORMAT(date, '%Y-%m-%d') as date,
                commission,
                finalamount,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM shop_goods 
                WHERE date = ?
                ORDER BY shopownerid ASC`;
            values = [date];
        } else if (month && year) {
            query = `SELECT 
                shopgoodsid,
                shopownerid,
                details,
                DATE_FORMAT(date, '%Y-%m-%d') as date,
                commission,
                finalamount,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM shop_goods 
                WHERE MONTH(date) = ? AND YEAR(date) = ?
                ORDER BY date DESC, shopownerid ASC`;
            values = [month, year];
        } else {
            query = `SELECT 
                shopgoodsid,
                shopownerid,
                details,
                DATE_FORMAT(date, '%Y-%m-%d') as date,
                commission,
                finalamount,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM shop_goods 
                ORDER BY date DESC, shopownerid ASC`;
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
                if (shopgoodsid && result.length === 0) {
                    return res.status(404).json({
                        status: false,
                        message: "Record not found",
                        data: []
                    });
                }
                // Parse details JSON
                const parsedResult = result.map(record => ({
                    ...record,
                    details: typeof record.details === 'string' ? JSON.parse(record.details) : record.details
                }));
                return res.status(200).json({
                    status: true,
                    message: "Success",
                    count: parsedResult.length,
                    data: parsedResult
                });
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 2. INSERT API ====================
router.post("/insert-shop-goods", function (req, res, next) {
    try {
        const { shopownerid, details, date, commission, finalamount } = req.body;

        if (!shopownerid || !details || !date) {
            return res.status(400).json({
                status: false,
                message: "Shop owner name, details, and date are required"
            });
        }

        const query = `INSERT INTO shop_goods 
            (shopownerid, details, date, commission, finalamount, createdat, updatedat) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
        const values = [
            shopownerid,
            details,
            date,
            commission || 0,
            finalamount || 0
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
                    shopgoodsid,
                    shopownerid,
                    details,
                    DATE_FORMAT(date, '%Y-%m-%d') as date,
                    commission,
                    finalamount,
                    DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                    DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                    FROM shop_goods WHERE shopgoodsid = ?`;

                pool.query(selectQuery, [result.insertId], function (err, insertedData) {
                    if (err) {
                        return res.status(200).json({
                            status: true,
                            message: "Record added successfully",
                            data: { shopgoodsid: result.insertId }
                        });
                    }
                    return res.status(200).json({
                        status: true,
                        message: "Record added successfully",
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
router.post("/update-shop-goods", function (req, res, next) {
    try {
        const { shopgoodsid, shopownerid, details, date, commission, finalamount } = req.body;

        if (!shopgoodsid) {
            return res.status(400).json({
                status: false,
                message: "Shop Goods ID is required"
            });
        }

        let updateFields = [];
        let values = [];

        if (shopownerid !== undefined && shopownerid !== '') {
            updateFields.push('shopownerid = ?');
            values.push(shopownerid);
        }
        if (details !== undefined && details !== '') {
            updateFields.push('details = ?');
            values.push(details);
        }
        if (date !== undefined && date !== '') {
            updateFields.push('date = ?');
            values.push(date);
        }
        if (commission !== undefined && commission !== '') {
            updateFields.push('commission = ?');
            values.push(commission);
        }
        if (finalamount !== undefined && finalamount !== '') {
            updateFields.push('finalamount = ?');
            values.push(finalamount);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No fields to update"
            });
        }

        updateFields.push('updatedat = NOW()');

        const query = `UPDATE shop_goods SET ${updateFields.join(', ')} WHERE shopgoodsid = ?`;
        values.push(shopgoodsid);

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
                        message: "Record not found"
                    });
                }

                const selectQuery = `SELECT 
                    shopgoodsid,
                    shopownerid,
                    details,
                    DATE_FORMAT(date, '%Y-%m-%d') as date,
                    commission,
                    finalamount,
                    DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                    DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                    FROM shop_goods WHERE shopgoodsid = ?`;

                pool.query(selectQuery, [shopgoodsid], function (err, updatedData) {
                    if (err) {
                        return res.status(200).json({
                            status: true,
                            message: "Record updated successfully",
                            affectedRows: result.affectedRows
                        });
                    }
                    return res.status(200).json({
                        status: true,
                        message: "Record updated successfully",
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
router.post("/delete-shop-goods", function (req, res, next) {
    try {
        const { shopgoodsid } = req.body;

        if (!shopgoodsid) {
            return res.status(400).json({
                status: false,
                message: "Shop Goods ID is required"
            });
        }

        const selectQuery = `SELECT 
            shopgoodsid,
            shopownerid,
            details,
            DATE_FORMAT(date, '%Y-%m-%d') as date,
            commission,
            finalamount
            FROM shop_goods WHERE shopgoodsid = ?`;

        pool.query(selectQuery, [shopgoodsid], function (error, result) {
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
                    message: "Record not found"
                });
            }

            const recordData = result[0];
            const deleteQuery = "DELETE FROM shop_goods WHERE shopgoodsid = ?";

            pool.query(deleteQuery, [shopgoodsid], function (error, deleteResult) {
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
                    message: "Record deleted successfully",
                    data: recordData
                });
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

module.exports = router;