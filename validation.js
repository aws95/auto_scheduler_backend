//validation for data passed to dataase

const Joi = require('@hapi/joi');


//register validation 

let regsitrationValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(6).required(),
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required(),
        role: Joi.string().min(5).required(),
    });
    return schema.validate(data);
}

//login validation 

let loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required(),
    });
    return schema.validate(data);
}

module.exports.regsitrationValidation = regsitrationValidation;
module.exports.loginValidation = loginValidation;