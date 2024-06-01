const path = require('path')
module.exports = {
    
    mode : "development",

    devtool : false,

    watch: false,

    entry: {
        
        producer :["./src/producer.js"],
        consumer :["./src/consumer.js"],
        join_live_streams: ["./src/join_live_streams.js"]
    },

    output: {
        filename : '[name].js',
        path : path.resolve(__dirname, 'public/js')
    }
}