import restart from 'vite-plugin-restart'

export default {
    root: 'src/', // Sources files (typically where index.html is)
    publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
    server:
    {
        host: true, // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build:
    {
        rollupOptions: {
            output: {
                // Use a specific pattern for asset filenames
                assetFileNames: ({ name }) => {
                    // You can customize the pattern based on the asset name or extension.
                    // For instance, here we remove the hash for assets in the images folder.
                    // Default pattern including a hash
                    return 'pong/name[extname]';
                },
                // Optionally customize JavaScript chunk and entry filenames
                entryFileNames: 'pong/[name].js',
                chunkFileNames: 'pong/[name].js',
            }
        },
        outDir: '../../templates/', // Output in the dist/ folder
        emptyOutDir: false, // Empty the folder first
        sourcemap: true, // Add sourcemap
    },
    plugins:
        [
            restart({ restart: ['../static/**',] }) // Restart server on static file change
        ],
}