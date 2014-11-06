module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['build'],
        copy: {
            build_debug: {
                expand: true,
                cwd: 'src',
                src: [
                    '**',
                    '!js/**/*-doc.js'
                ],
                dest: 'build/debug/'
            },
            build_debug_single_js: {
                expand: true,
                cwd: 'build/debug',
                src: ['**', '!js/**/*'],
                dest: 'build/debug-single-js/'
            },
            build_deploy: {
                expand: true,
                cwd: 'build/debug',
                src: ['**', '!js/**/*'],
                dest: 'build/deploy/'
            }
        },
        'curl-dir': {
            dependencies: {
                src: [
                  'https://code.jquery.com/jquery-1.11.0.min.js',
                  'https://code.jquery.com/ui/1.11.1/jquery-ui.min.js',
                  'https://sdk.amazonaws.com/js/aws-sdk-2.0.16.min.js'
                ],
                dest: 'build/debug/js'
            }
        },
        concat: {
            options: {
                separator: ';\n\n\n'
            },
            debug_single_js: {
                src: [
                    'build/debug/js/jquery-1.11.0.min.js',
                    'build/debug/js/jquery-ui.min.js',
                    'build/debug/js/aws-sdk-2.0.16.min.js',
                    'build/debug/js/**/*.js'
                ],
                dest: 'build/debug-single-js/js/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            deploy: {
                files: {
                    'build/deploy/js/<%= pkg.name %>.min.js': ['<%= concat.debug_single_js.dest %>']
                }
            }
        },
        processhtml: {
            options: {
                strip: true
            },
            debug_single_js: {
                files: {
                    'build/debug-single-js/index.html': ['build/debug/index.html']
                }
            },
            deploy: {
                files: {
                    'build/deploy/index.html': ['build/debug/index.html']
                }
            }
        },

        qunit: {
            files: ['test/**/*.html']
        }

        //    jshint: {
        //      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
        //      options: {
        // options here to override JSHint defaults
        //        globals: {
        //          jQuery: true,
        //          console: true,
        //          module: true,
        //          document: true
        //        }
        //      }
        //    },
        //    watch: {
        //      files: ['<%= jshint.files %>'],
        //      tasks: ['jshint', 'qunit']
        //  }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    //grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    //grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    //grunt.registerTask('test', ['jshint', 'qunit']);
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-curl');

    grunt.registerTask('default', ['copy:build_debug', 'curl-dir:dependencies', 'copy:build_debug_single_js', 'concat:debug_single_js', 'processhtml:debug_single_js', 'copy:build_deploy', 'uglify:deploy', 'processhtml:deploy']);

};
