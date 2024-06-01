module.exports = {
    users: {
        create: {
            first_name: {
                required: true,
                message: 'firstName cannot be empty'
            },
            middle_name: {
                required: true,
                message: 'middle name cannot be empty'
            },
            last_name: {
                required: true,
                message: 'last name cannot be empty'
            },
            email: {
                required: true,
                type: 'email',
                message: 'Invalid email'
            },
            
            age: {
                required: true,
                message: 'the age is not empty'
            },
            sex: {
                required: true,
                message: 'the sex is not empty'
            },
            phone_number: {
                required: true,
                len: 13,
                message: 'Invalid Phone'
            },
            password: {
                required: true,
                min: 6,
                message: 'Invalid Password'
            },
         
        },
    }
}
