// debtRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('./pool');

// ==================== 1. SELECT (Retrieve) API ====================
router.post("/retrieve-debts", function (req, res, next) {
    try {
        const { debtid, salesmanid } = req.body;

        let query;
        let values = [];

        if (debtid) {
            query = `SELECT 
                d.debtid,
                d.salesmanid,
                s.fullname as salesman_name,
                s.mobileno as salesman_mobile,
                d.type,
                DATE_FORMAT(d.debt_date, '%Y-%m-%d') as debt_date,
                d.amount,
                DATE_FORMAT(d.createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(d.updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM salesman_debt d
                LEFT JOIN salesman s ON d.salesmanid = s.salesmanid
                WHERE d.debtid = ?`;
            values = [debtid];
        } else if (salesmanid) {
            query = `SELECT 
                d.debtid,
                d.salesmanid,
                s.fullname as salesman_name,
                s.mobileno as salesman_mobile,
                d.type,
                DATE_FORMAT(d.debt_date, '%Y-%m-%d') as debt_date,
                d.amount,
                DATE_FORMAT(d.createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(d.updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM salesman_debt d
                LEFT JOIN salesman s ON d.salesmanid = s.salesmanid
                WHERE d.salesmanid = ?
                ORDER BY d.debt_date DESC`;
            values = [salesmanid];
        } else {
            query = `SELECT 
                d.debtid,
                d.salesmanid,
                s.fullname as salesman_name,
                s.mobileno as salesman_mobile,
                d.type,
                DATE_FORMAT(d.debt_date, '%Y-%m-%d') as debt_date,
                d.amount,
                DATE_FORMAT(d.createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(d.updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM salesman_debt d
                LEFT JOIN salesman s ON d.salesmanid = s.salesmanid
                ORDER BY d.debt_date DESC`;
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
                if (debtid && result.length === 0) {
                    return res.status(404).json({
                        status: false,
                        message: "Debt record not found",
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
router.post("/insert-debt", function (req, res, next) {
    try {
        const { salesmanid, type, debt_date, amount } = req.body;

        if (!salesmanid || !type || !debt_date || !amount) {
            return res.status(400).json({
                status: false,
                message: "Salesman ID, Type, Date, and Amount are required"
            });
        }

        // Check if salesman exists
        const checkSalesman = "SELECT salesmanid FROM salesman WHERE salesmanid = ?";
        pool.query(checkSalesman, [salesmanid], function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: err.sqlMessage
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Salesman not found"
                });
            }

            const query = `INSERT INTO salesman_debt (salesmanid, type, debt_date, amount, createdat, updatedat) 
                           VALUES (?, ?, ?, ?, NOW(), NOW())`;
            const values = [salesmanid, type, debt_date, amount];

            pool.query(query, values, function (error, insertResult) {
                if (error) {
                    console.log(error);
                    return res.status(500).json({
                        status: false,
                        message: "Database Error...",
                        error: error.sqlMessage
                    });
                }

                const selectQuery = `SELECT 
                    d.debtid,
                    d.salesmanid,
                    s.fullname as salesman_name,
                    s.mobileno as salesman_mobile,
                    d.type,
                    DATE_FORMAT(d.debt_date, '%Y-%m-%d') as debt_date,
                    d.amount,
                    DATE_FORMAT(d.createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                    DATE_FORMAT(d.updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                    FROM salesman_debt d
                    LEFT JOIN salesman s ON d.salesmanid = s.salesmanid
                    WHERE d.debtid = ?`;

                pool.query(selectQuery, [insertResult.insertId], function (err, insertedData) {
                    if (err) {
                        return res.status(200).json({
                            status: true,
                            message: "Debt record added successfully",
                            data: { debtid: insertResult.insertId }
                        });
                    }
                    return res.status(200).json({
                        status: true,
                        message: "Debt record added successfully",
                        data: insertedData[0]
                    });
                });
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 3. UPDATE API ====================
router.post("/update-debt", function (req, res, next) {
    try {
        const { debtid, salesmanid, type, debt_date, amount } = req.body;

        if (!debtid) {
            return res.status(400).json({
                status: false,
                message: "Debt ID is required"
            });
        }

        let updateFields = [];
        let values = [];

        if (salesmanid !== undefined && salesmanid !== '') {
            updateFields.push('salesmanid = ?');
            values.push(salesmanid);
        }
        if (type !== undefined && type !== '') {
            updateFields.push('type = ?');
            values.push(type);
        }
        if (debt_date !== undefined && debt_date !== '') {
            updateFields.push('debt_date = ?');
            values.push(debt_date);
        }
        if (amount !== undefined && amount !== '') {
            updateFields.push('amount = ?');
            values.push(amount);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No fields to update"
            });
        }

        updateFields.push('updatedat = NOW()');

        const query = `UPDATE salesman_debt SET ${updateFields.join(', ')} WHERE debtid = ?`;
        values.push(debtid);

        pool.query(query, values, function (error, result) {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    status: false,
                    message: "Database Error...",
                    error: error.sqlMessage
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Debt record not found"
                });
            }

            const selectQuery = `SELECT 
                d.debtid,
                d.salesmanid,
                s.fullname as salesman_name,
                s.mobileno as salesman_mobile,
                d.type,
                DATE_FORMAT(d.debt_date, '%Y-%m-%d') as debt_date,
                d.amount,
                DATE_FORMAT(d.createdat, '%Y-%m-%d %H:%i:%s') as createdat,
                DATE_FORMAT(d.updatedat, '%Y-%m-%d %H:%i:%s') as updatedat
                FROM salesman_debt d
                LEFT JOIN salesman s ON d.salesmanid = s.salesmanid
                WHERE d.debtid = ?`;

            pool.query(selectQuery, [debtid], function (err, updatedData) {
                if (err) {
                    return res.status(200).json({
                        status: true,
                        message: "Debt record updated successfully",
                        affectedRows: result.affectedRows
                    });
                }
                return res.status(200).json({
                    status: true,
                    message: "Debt record updated successfully",
                    affectedRows: result.affectedRows,
                    data: updatedData[0]
                });
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

// ==================== 4. DELETE API ====================
router.post("/delete-debt", function (req, res, next) {
    try {
        const { debtid } = req.body;

        if (!debtid) {
            return res.status(400).json({
                status: false,
                message: "Debt ID is required"
            });
        }

        const selectQuery = `SELECT 
            d.debtid,
            d.salesmanid,
            s.fullname as salesman_name,
            d.type,
            DATE_FORMAT(d.debt_date, '%Y-%m-%d') as debt_date,
            d.amount
            FROM salesman_debt d
            LEFT JOIN salesman s ON d.salesmanid = s.salesmanid
            WHERE d.debtid = ?`;

        pool.query(selectQuery, [debtid], function (error, result) {
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
                    message: "Debt record not found"
                });
            }

            const debtData = result[0];

            const deleteQuery = "DELETE FROM salesman_debt WHERE debtid = ?";

            pool.query(deleteQuery, [debtid], function (error, deleteResult) {
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
                    message: "Debt record deleted successfully",
                    data: debtData
                });
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ status: false, message: "Technical Issue..." });
    }
});

module.exports = router;