const express = require("express");
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser, authenticateJWT } = require("../middleware/auth");
const ExpressError = require("../expressError");
const { authenticate } = require("../models/user");
const router = new express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', authenticateJWT, ensureLoggedIn, async function (req, res, next) {
    try {
        const message = await Message.get(req.params.id);
        if (req.user.username !== message.to_username || req.user.username !== message.from_username){
            throw new ExpressError("User not associated with requested message!", 401);
        } else return res.json({ message });
    } catch(e) {
        return next(e);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', authenticateJWT, ensureLoggedIn, async function (req, res, next) {
    try {
        Message.create(req.user.username, req.body.to_username, req.body.body);
    } catch(e) {
        return next(e);
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', authenticateJWT, ensureLoggedIn, async function (req, res, next) {
    try {
        const message = await Message.get(req.params.id);
        if(req.user.username !== message.to_username){
            throw new ExpressError("Unauthorized access", 404);
        }
        Message.markRead(req.params.id)
    } catch(e) {
        return next(e);
    }
});
module.exports = router;