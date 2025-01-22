import jwt from 'jsonwebtoken';
import User from '../user/user.model.js';

// admin role
export const isAdmin = async (req, res, next) => {
  try {
    // extract token from req.headers
    const authorization = req.headers.authorization;

    const splittedArray = authorization?.split(' ');

    const token = splittedArray?.length === 2 ? splittedArray[1] : null;

    // if not token ,throw error
    if (!token) {
      throw new Error();
    }

    const secretKey = process.env.ACCESS_TOKEN_SECRET_KEY;

    //  verify token
    const payload = jwt.verify(token, secretKey);

    // find user using email from payload
    const user = await User.findOne({ email: payload.email });

    // if not user found, throw error
    if (!user) {
      throw new Error();
    }

    // check if user role is "admin"
    //  if user role is not "admin", throw error
    if (user.role !== 'admin') {
      throw new Error();
    }

    // attach user._id to req
    req.loggedInUserId = user._id;

    // call next function
    next();
  } catch (error) {
    return res.status(401).send({ message: 'You are not admin.' });
  }
};

// role can be admin or buyer
// role is not checked
export const isUser = async (req, res, next) => {
  try {
    // extract token from req.headers
    const authorization = req.headers.authorization;

    const splittedArray = authorization?.split(' ');

    const token = splittedArray?.length === 2 ? splittedArray[1] : null;

    // if not token ,throw error
    if (!token) {
      throw new Error();
    }

    const secretKey = process.env.ACCESS_TOKEN_SECRET_KEY;

    //  verify token
    const payload = jwt.verify(token, secretKey);

    // find user using email from payload
    const user = await User.findOne({ email: payload.email });

    // if not user found, throw error
    if (!user) {
      throw new Error();
    }

    // attach user._id to req
    req.loggedInUserId = user._id;

    // call next function
    next();
  } catch (error) {
    return res.status(401).send({ message: 'Unauthorized.' });
  }
};

// buyer role
export const isBuyer = async (req, res, next) => {
  try {
    // extract token from req.headers
    const authorization = req.headers.authorization;

    const splittedArray = authorization?.split(' ');

    const token = splittedArray?.length === 2 ? splittedArray[1] : null;

    // if not token ,throw error
    if (!token) {
      throw new Error();
    }

    const secretKey = process.env.ACCESS_TOKEN_SECRET_KEY;

    //  verify token
    const payload = jwt.verify(token, secretKey);

    // find user using email from payload
    const user = await User.findOne({ email: payload.email });

    // if not user found, throw error
    if (!user) {
      throw new Error();
    }

    // check if user role is "buyer"
    //  if user role is not "buyer", throw error
    if (user.role !== 'buyer') {
      throw new Error();
    }

    // attach user._id to req
    req.loggedInUserId = user._id;

    // call next function
    next();
  } catch (error) {
    return res.status(401).send({ message: 'Unauthorized.' });
  }
};
