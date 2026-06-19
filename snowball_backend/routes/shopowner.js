const express = require('express');
const router = express.Router();
const pool = require('./pool');

// ==================== 1. SELECT (Retrieve) API ====================
router.post("/retrieve-shop-owners", function (req, res, next) {
    try {
        const { shopownerid } = req.body;

        let query;
        let values = [];

        if (shopownerid) {
            query = `SELECT 
                shopownerid,
                shopownername,
                shopname,
                mobileno,
                address,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM shop_owners WHERE shopownerid = ?`;
            values = [shopownerid];
        } else {
            query = `SELECT 
                shopownerid,
                shopownername,
                shopname,
                mobileno,
                address,
                DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM shop_owners ORDER BY shopownername ASC`;
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
                if (shopownerid && result.length === 0) {
                    return res.status(404).json({
                        status: false,
                        message: "Shop owner not found",
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
router.post("/insert-shop-owner", function (req, res, next) {
    try {
        const { shopownername, shopname, mobileno, address } = req.body;

        if (!shopownername || !shopname || !mobileno) {
            return res.status(400).json({
                status: false,
                message: "Shop owner name, shop name, and mobile number are required"
            });
        }

        // Check if already exists
        const checkQuery = "SELECT shopownerid FROM shop_owners WHERE shopownername = ?";
        pool.query(checkQuery, [shopownername], function (err, checkResult) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: err.sqlMessage
                });
            }

            if (checkResult.length > 0) {
                return res.status(400).json({
                    status: false,
                    message: "Shop owner already exists"
                });
            }

            const query = `INSERT INTO shop_owners 
                (shopownername, shopname, mobileno, address, createdat, updatedat) 
                VALUES (?, ?, ?, ?, NOW(), NOW())`;
            const values = [shopownername, shopname, mobileno, address || null];

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
                        shopownerid,
                        shopownername,
                        shopname,
                        mobileno,
                        address,
                        DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                        DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                        FROM shop_owners WHERE shopownerid = ?`;

                    pool.query(selectQuery, [result.insertId], function (err, insertedData) {
                        if (err) {
                            return res.status(200).json({
                                status: true,
                                message: "Shop owner added successfully",
                                data: { shopownerid: result.insertId }
                            });
                        }
                        return res.status(200).json({
                            status: true,
                            message: "Shop owner added successfully",
                            data: insertedData[0]
                        });
                    });
                }
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 3. UPDATE API ====================
router.post("/update-shop-owner", function (req, res, next) {
    try {
        const { shopownerid, shopownername, shopname, mobileno, address } = req.body;

        if (!shopownerid) {
            return res.status(400).json({
                status: false,
                message: "Shop owner ID is required"
            });
        }

        if (!shopownername || !shopname || !mobileno) {
            return res.status(400).json({
                status: false,
                message: "Shop owner name, shop name, and mobile number are required"
            });
        }

        // Check if name already exists (excluding current)
        const checkQuery = "SELECT shopownerid FROM shop_owners WHERE shopownername = ? AND shopownerid != ?";
        pool.query(checkQuery, [shopownername, shopownerid], function (err, checkResult) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: err.sqlMessage
                });
            }

            if (checkResult.length > 0) {
                return res.status(400).json({
                    status: false,
                    message: "Shop owner name already exists"
                });
            }

            const query = `UPDATE shop_owners 
                SET shopownername = ?, 
                    shopname = ?, 
                    mobileno = ?, 
                    address = ?, 
                    updatedat = NOW() 
                WHERE shopownerid = ?`;
            const values = [shopownername, shopname, mobileno, address || null, shopownerid];

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
                            message: "Shop owner not found"
                        });
                    }

                    const selectQuery = `SELECT 
                        shopownerid,
                        shopownername,
                        shopname,
                        mobileno,
                        address,
                        DATE_FORMAT(createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                        DATE_FORMAT(updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                        FROM shop_owners WHERE shopownerid = ?`;

                    pool.query(selectQuery, [shopownerid], function (err, updatedData) {
                        if (err) {
                            return res.status(200).json({
                                status: true,
                                message: "Shop owner updated successfully",
                                affectedRows: result.affectedRows
                            });
                        }
                        return res.status(200).json({
                            status: true,
                            message: "Shop owner updated successfully",
                            affectedRows: result.affectedRows,
                            data: updatedData[0]
                        });
                    });
                }
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 4. DELETE API ====================
router.post("/delete-shop-owner", function (req, res, next) {
    try {
        const { shopownerid } = req.body;

        if (!shopownerid) {
            return res.status(400).json({
                status: false,
                message: "Shop owner ID is required"
            });
        }

        const selectQuery = `SELECT shopownerid, shopownername, shopname, mobileno, address FROM shop_owners WHERE shopownerid = ?`;

        pool.query(selectQuery, [shopownerid], function (error, result) {
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
                    message: "Shop owner not found"
                });
            }

            const ownerData = result[0];
            const deleteQuery = "DELETE FROM shop_owners WHERE shopownerid = ?";

            pool.query(deleteQuery, [shopownerid], function (error, deleteResult) {
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
                    message: "Shop owner deleted successfully",
                    data: ownerData
                });
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

module.exports = router;