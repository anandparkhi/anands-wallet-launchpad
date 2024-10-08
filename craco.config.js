const webpack = require('webpack');

module.exports = {
    webpack: {
      configure: {
        resolve: {
          fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "zlib": require.resolve("browserify-zlib"),
            "url": require.resolve("url/"),
            "buffer": require.resolve("buffer/") 
          }
        },
        plugins: [
          // Define plugin to provide Buffer globally
          new webpack.ProvidePlugin({
              Buffer: ['buffer', 'Buffer'],
          })
      ]
      }
    }
  };
  