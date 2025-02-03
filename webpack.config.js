import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

// Tạo __dirname tương thích với ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    entry: {
        window: "./src/window/index.tsx", // New entry point for the window
        background: "./src/background/background.ts",
        options: './src/options/options.tsx',
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
            template: "./src/window/window.html", // Template for the new window
            filename: "window.html",
            chunks: ["window"],
        }),
        new HtmlWebpackPlugin({
            template: "./src/options/options.html", // Template for the new window
            filename: "options.html",
            chunks: ["options"],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "public/manifest.json",
                    to: "manifest.json",
                },
                {
                    from: "public/icon.png",
                    to: "icon.png",
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
    }
};