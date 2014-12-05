module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['build'],

        bower_concat: {
            all: {
                dest: 'build/debug/js/libs.js',
                cssDest: 'build/debug/css/libs.css'
            }
        },

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
        concat: {
            options: {
                separator: ';\n\n\n'
            },
            debug_single_js: {
                src: [
                    'build/debug/js/libs.js',
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
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-bower-concat');

    grunt.registerTask('bower_install', 'install dependencies', function () {
        var exec = require('child_process').exec;
        var cb = this.async();
        exec('bower install', { cwd: '.' }, function (err, stdout, stderr) {
            console.log(stdout);
            cb();
        });
    });

    grunt.registerTask('bower_update', 'update dependencies', function () {
        var exec = require('child_process').exec;
        var cb = this.async();
        exec('bower update', { cwd: '.' }, function (err, stdout, stderr) {
            console.log(stdout);
            cb();
        });
    });

    grunt.registerTask('default', ['clean', 'bower_concat', 'copy:build_debug']);
    grunt.registerTask('deploy', ['bower_install', 'bower_update', 'clean', 'bower_concat', 'copy:build_debug', 'copy:build_debug_single_js', 'concat:debug_single_js', 'processhtml:debug_single_js', 'copy:build_deploy', 'uglify:deploy', 'processhtml:deploy']);

};
