'use strict'; // indicate to use Strict Mode    
module.exports = function(grunt) {
    // Set project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            './build/js/bundle.js': './js/api_console.js',
        },
        clean: ['./build/*'],
        copy: {
            main: {
                src: './css/*',
                dest: './build/'
            }
        },
        jshint: {
            // define the files to lint
            files: ['./Gruntfile.js', './js/extension.js', './js/api_console.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                strict: true,
                globalstrict: true,
                globals: {
                    $: true,
                    document: true,
                    window: true,
                    console: true,
                    module: true,
                    hyperbaseForFrameAccess: true,
                    require: true
                }
            }
        }
    });

    // Load the relevant plugins for the default task
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-browserify');

    // Default Tasks:
    grunt.registerTask('default', [
        'clean',
        'copy:main',
        'jshint',
        'browserify'
    ]);
};