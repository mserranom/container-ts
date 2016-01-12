"use strict";

var conf = function(grunt) {

    var props = {
        package : 'package.json',
        srcDir : 'src',
        testDir : 'test',
        targetDir : 'dist',
        targetTestDir : 'dist/test',
        name : '<%= pkg.name %>',
        version : '<%= pkg.version %>'
    };

    props.targetJs = props.targetDir + '/' + props.name + '.js';
    props.targetJsMin = props.targetDir + '/' + props.name + '.min.js';
    props.targetTestJs = props.targetTestDir + '/' + props.name + '-test' + '.js';

    props.clean = {};
    props.clean.target = [ props.targetDir, '_SpecRunner.html', props.srcDir + '/**/*.js', props.srcDir + '/**/*.js.map',
        props.srcDir + '/**/*.html', props.testDir + '/**/*.js',  props.testDir + '/**/*.js.map',
        props.srcDir + '/*.d.ts', props.testDir + '/**/*.d.ts',props.testDir + '/**/*.html'];

    props.mocha = {};
    props.mocha.test = {
            options: {
                require: 'babel-core/register',
                reporter: 'spec',
                captureFile: props.targetTestDir + '/results.txt', // Optionally capture the reporter output to a file
                quiet: false, // Optionally suppress output to standard out (defaults to false)
                clearRequireCache: true // Optionally clear the require cache before running tests (defaults to false)
            },
            src: [props.testDir + '/*.js']
        };

    props.notify = {};
    props.notify.options = {
            enabled: true,
                max_jshint_notifications: 2, // maximum number of notifications from jshint output
                title: '<%= pkg.name %>', // defaults to the name in package.json, or will use project directory's name
                success: true, // whether successful grunt executions should be notified automatically
                duration: 3 // the duration of notification in seconds, for `notify-send only
        };

    props.watch = {
            scripts: {
                files: [props.srcDir + '/**/*.ts', props.testDir + '/**/*.ts'],
                tasks: ['test'],
                options: {
                    spawn: true
                }
            }
        };

    var gruntConfig = {
        pkg: props.package,

        clean: props.clean,

        ts: {
            options: {
                fast: 'never'
            },
            default: {
                tsconfig: './tsconfig.json'
            }
        },

        copy: {
            build: {
                src: ["*.js*", "**/*.d.ts"],
                dest: props.targetDir + "/",
                cwd: props.srcDir,
                expand: true // it appears you need to you need expand:true when using cwd https://github.com/gruntjs/grunt-contrib-copy/issues/90que
            },
            test: {
                src: "*.js",
                dest: props.targetTestDir + "/",
                cwd: props.targetDir,
                expand: true // it appears you need to you need expand:true when using cwd https://github.com/gruntjs/grunt-contrib-copy/issues/90que
            }
        },

        mochaTest: props.mocha,

        watch: props.watch,

        notify_hooks: props.notify
    };

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-notify');

    var tasks = [
        ["compile", ["clean", "ts", "copy"]],
        ["test", ["compile", "mochaTest"]],
        ["default", ["test"]]
    ];

    tasks.forEach( function(task){ grunt.registerTask(task[0], task[1])} );

    return {
        properties : props,
        grunt : gruntConfig
    };

};



module.exports = function (grunt) {

    "use strict";

    var config = conf(grunt);

    config.properties.name = "container";

    grunt.initConfig(config.grunt);

    grunt.task.run('notify_hooks'); //requires 'brew install terminal-notifier'

};
