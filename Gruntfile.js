module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['build'],
        copy: {
            build_debug: {
                src: [
                    'index.html',
                    'js/**/*', '!js/**/*-doc.js',
                    'css/**/*',
                    'images/**/*'
                ],
                dest: 'build/debug/'
            },
            build_debug2: {
                cwd: 'build/debug',
                src: ['**/*', '!js/**/*'],
                dest: 'build/debug2/'
            },
            build_deploy: {
                cwd: 'build/debug',
                src: ['**/*', '!js/**/*'],
                dest: 'build/deploy/'
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            debug2: {
                src: ['build/debug/js/**/*.js'],
                dest: 'build/debug2/js/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            deploy: {
                files: {
                    'build/deploy/js/<%= pkg.name %>.min.js': ['<%= concat.debug2.dest %>']
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

    grunt.registerTask('default', ['clean', 'copy:build_debug', 'copy:build_debug2', 'concat:debug2', 'copy:build_deploy', 'uglify:deploy']);

};
