let mongoose = require('mongoose');

const validator = {
    isValidObjectID: (id) => {
        let ObjectID = mongoose.Types.ObjectId
        return ObjectID.isValid(id);
    }
}

module.exports = validator;