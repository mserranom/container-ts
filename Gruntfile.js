module.exports = function (grunt) {

    "use strict";

    var project = {
        srcDir : 'src',
        testDir : 'test',
        targetDir : 'dist',
        targetTestDir : 'dist/test',
        name : 'container',
        version : '<%= pkg.version %>',
        extension : 'ts'
    };
    project.targetJs = project.targetDir + '/' + project.name + '.js';
    project.targetJsMin = project.targetDir + '/' + project.name + '.min.js';
    project.targetTestJs = project.targetTestDir + '/' + project.name + '-test' + '.js';


    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        clean:{
            target:[ project.targetDir,'_SpecRunner.html', project.srcDir + '/**/*.js', project.srcDir + '/**/*.js.map',
                project.srcDir + '/**/*.html', project.testDir + '/**/*.js',  project.testDir + '/**/*.js.map',
                project.srcDir + '/**/*.d.ts', project.testDir + '/**/*.d.ts',project.testDir + '/**/*.html']
        },

        typescript: {
            base: {
                src: [project.srcDir + '/*.ts'],
                dest: project.targetJs
            },
            test: {
                src: [project.testDir + '/*.ts'],
                dest: project.targetTestJs
            },
            options: {
                module: 'commonjs',
                target: 'ES5',
                basePath: project.srcDir,
                sourceMap: false,
                declaration: true,
                removeComments: true
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    captureFile: project.targetTestDir + '/results.txt', // Optionally capture the reporter output to a file
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: true // Optionally clear the require cache before running tests (defaults to false)
                },
                src: [project.testDir + '/*.js']
            }
        },

        zip: {
            'dist.zip': ['src/main/ts/*.js', 'node_modules/**/*']
        },

        watch: {
            scripts: {
                files: [project.srcDir + '/**/*.ts', project.testDir + '/**/*.ts'],
                tasks: ['test'],
                options: {
                    spawn: true
                }
            }
        },

        notify_hooks: {
            options: {
                enabled: true,
                max_jshint_notifications: 2, // maximum number of notifications from jshint output
                title: '<%= pkg.name %>', // defaults to the name in package.json, or will use project directory's name
                success: true, // whether successful grunt executions should be notified automatically
                duration: 3 // the duration of notification in seconds, for `notify-send only
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-notify');

    grunt.registerTask("compile", ["clean", "typescript"]);
    grunt.registerTask("test", ["compile", "mochaTest"]);
    grunt.registerTask("default", ["test"]);

    grunt.task.run('notify_hooks'); //requires 'brew install terminal-notifier'

};