import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

// Tạo __dirname tương thích với ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    mode: "development", // Đảm bảo đang chạy development mode
    devtool: "source-map", // Tránh sử dụng eval() để fix lỗi CSP
    //entry: './src/window/index.tsx',
    entry: {
        chatbox : "./src/chatbox/index.tsx", // New entry point for the chatbox
        background: "./src/background/background.ts",
        contentScript: './src/content/contentScript.ts',
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    'postcss-loader'
                ]
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/chatbox/index.html", // Template for the new window
            filename: "index.html",
            chunks: ["chatbox"],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "public/manifest.json",
                    to: "manifest.json",
                },
                {
                    from: "public/icon.png",
                    to: "assets/icon.png",
                },
                {
                    from: "public/icon128.png",
                    to: "assets/icon128.png",
                }
            ],
        }),
    ],
    optimization: {
        splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 244 * 1024, // 244 KiB
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        port: 'auto',
        open: true,
        hot:true, // Bật Hot Module Replacement để cập nhật trang nhanh hơn.
        headers: {
            "Content-Security-Policy": "script-src 'self' 'unsafe-inline' http://localhost:* http://127.0.0.1:*"
        }
    },
};