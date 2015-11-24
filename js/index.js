var filePath = "/var/www/myweb/gulp_auto_build_demo/gulpfile.js";
var readline = require('readline');
var util = require('util');
var cp = require('child_process');
var pt = require('path');
var help = require('./js/help');
var events = require('events');
var commonEmitter = new events.EventEmitter();
var DATA_PATH = "data.json";


function ab2str(buf) {
    return String.fromCharCode.apply(null, buf);
}

var projectsCon = {
    projectData:help.readJson(DATA_PATH),
    currentProject:{},
    openProject:function(index){
        if(typeof index == 'undefined'){
            index = 0;
        }
        if(this.projectData['projects'][index]){
            this.currentProject = this.projectData['projects'][index];
            this.projectData['current'] = this.currentProject['name'];
            $("#projectList li").removeClass('active').eq(index).addClass('active');
            commonEmitter.emit("PROJECT_CHANGE",this.currentProject);
            this.writeData();
        }
    },
    getData:function(name){
        var projects = this.projectData['projects'];
        var project = help.filterArray(projects,'name',name);
        if(project.length>0){
            return project[0];
        }else{
            return false;
        }
    },
    writeData:function(){
        help.writeJson(DATA_PATH,this.projectData);
    },
    addProject:function(name,filePath){
        var projects = this.projectData['projects'];
        var sameNameProject = this.getData(name);
        if(sameNameProject){
            window.alert("已有同名项目");
            return false;
        }
        projects.push({
            name:name,
            filePath:filePath,
            path:pt.dirname(filePath)
        });
        this.writeData();
        this.flushProject();
        return true;
    },

    delProject:function(index){
        var projects = this.projectData['projects'];
        projects.splice(index,1);
        this.writeData();
        this.flushProject();
        return true;
    },
    zeroProject:function(){
        $('#projectList').html('<li><a href="#">无项目</a></li>');
        commonEmitter.emit('ZERO_PROJECT');
    },
    buildProjectList:function(){
        var projects =this.projectData["projects"];
        var projectsHtml = '';
        if(projects.length>0){
            for(var i= 0,l=projects.length;i<l;i++){
                var active = '';
                if(projects[i]['name'] == this.projectData['current']){
                    active = 'active';
                    this.defaultIndex = i;
                }
                var projectHtml = '<li class="'+active+'"><a href="javascript:void(0);" data-path="'+projects[i]['path']+'" data-index="'+i+'">'+projects[i]['name']+'</a><span class="del-button">X</span></li>';

                projectsHtml = projectsHtml+projectHtml;
            }
            $('#projectList').html(projectsHtml);
        }else{
            this.zeroProject()
        }
    },
    bindEvent:function(){
        var _this = this;
        $('#projectList').on('click','a',function(ev){
            ev.preventDefault();
            var index = $(this).data('index');
            _this.openProject(index);
        });
        $('#addProjectBtn').on('click',function(ev){
            $('#addFileDialog').data('dialog').open();
        });

        $('#addProject').on('click',function(){
            var name = $.trim($('#projectNameInput').val());
            var path = $('#gulpfileInput').val();
            if(name==''){
                window.alert('请输入项目名称');
            }
            if(path ==''){
                window.alert('请选择gulpfile');
            }
            if(name&&path){
                var res = _this.addProject(name,path);
                if(res){
                    $('#addFileDialog').data('dialog').close();
                }else{

                }
            }
        });

        $('#projectList').on('click','.del-button',function(ev){
            var dataLink = $(this).siblings('a');
            var index = dataLink.data('index');
            _this.delProject(index);
        });
    },
    init:function(){
        this.flushProject();
        this.bindEvent();
    },
    flushProject:function(){
        this.buildProjectList();
        this.openProject(this.defaultIndex);
    }
};

var tasksCon = {
    getTasks:function(projectPath){
        var dtd = $.Deferred();
        var tasksList = [];
        var errList = [];
        var ls = cp.spawn(
            'gulp',
            ['--tasks-simple'],
            {
                cwd: projectPath,
                env: process.env
            });
        ls.stdout.on('data', function (data) {
            var result  = ab2str(data);
            tasksList.push(result);
        });

        ls.stderr.on('data', function (data) {
            errList.push(ab2str(data));
        });

        ls.on('exit', function (code) {
            if(code=='0'){
                var result = tasksList.join().split('\n');
                if(result[result.length-1]==''){
                    result.pop();
                }
                dtd.resolve(result);
            }else{
                dtd.reject(errList);
            }
        });
        return dtd.promise();
    },
    flushTasks:function(project){
        if(project){
            this.currentProject = project;
        }else{
            project = this.currentProject||{};
        }
        var projectPath = project['path'];
        var _this = this;
        if(projectPath){
            $('#gulpTaskList').html('<li><a href="">loading</a></li>');
            _this.getTasks(projectPath).then(function(tasks){
                var tasksHtml = '';
                if(tasks.length>0){
                    for(var i=0;i<tasks.length;i++){
                        var taskHtml = '<li><a href="javascript:void(0);" data-name="'+tasks[i]+'">'+tasks[i]+'</a></li>';
                        tasksHtml = tasksHtml+taskHtml;
                    }
                }else{
                    tasksHtml = '<li><a href="">无任务</a></li>';
                }

                tasksHtml +='';
                $('#gulpTaskList').html(tasksHtml);
            },function(){
                console.log(arguments);
            });
        }else{
            _this.zeroTasks();
        }

    },
    zeroTasks:function(){
        $('#gulpTaskList').html('<li><a href="">无任务</a></li>');
    },
    bindEvent:function(){
        var _this = this;
        $('#gulpTaskList').on('click','a',function(ev){
            ev.preventDefault();
            var taskName = $(this).data('name');
            var project = projectsCon.currentProject;
            if(project.path){
                _this.runGulpTask([taskName],project.path).then(function(results){
                    console.log('end');
                },function(errRes){

                })
            }else{

            }
        });

        $("#flushTasksBtn").on('click',function(){
            _this.flushTasks();
        });

        $("#npmInstallBtn").on('click',function(){
           _this.npmInstall();
        });
    },
    init:function(){
        this.bindEvent();
    },
    runNpmInstall:function(path){
        var dtd = $.Deferred();
        var tasksList = [];
        var errList = [];
        var ls = cp.spawn(
            'npm',
            ['install','-d'],
            {
                cwd:path,
                env:process.env
            });
        commonEmitter.emit('CONSOLE_RUNING','任务执行中');
        help.emitLines(ls.stdout);
        ls.stdout.on('line',function(data){
            commonEmitter.emit('CONSOLE_ADD_ROW',data);
        });

        ls.stderr.on('data', function (data) {
            //console.log(data);
            errList.push(ab2str(data));
        });

        ls.on('exit', function (code) {
            if(code=='0'){
                var result = tasksList.join().split('\n');
                if(result[result.length-1]==''){
                    result.pop();
                }
                dtd.resolve(result);
            }else{
                dtd.reject(errList);
            }
        });
        return dtd.promise();
    },
    npmInstall:function(){
        var _this = this;
        var currentProject = projectsCon.currentProject;
        if(currentProject.path){
            _this.runNpmInstall(currentProject.path).then(function(results){
                console.log('end');
                _this.npmInstall();
            },function(errRes){

            });
        }
    },
    runGulpTask:function(task,projectPath){
        var dtd = $.Deferred();
        var tasksList = [];
        var errList = [];
        var ls = cp.spawn(
            'gulp',
            task,
            {
                cwd: projectPath,
                env: process.env
            });
        commonEmitter.emit('CONSOLE_RUNING','任务执行中');
        help.emitLines(ls.stdout);
        ls.stdout.on('line',function(data){
            commonEmitter.emit('CONSOLE_ADD_ROW',data);
        });

        //ls.stdout.on('data', function (data) {
        //    tasksList.push(ab2str(data));
        //});

        ls.stderr.on('data', function (data) {
            errList.push(ab2str(data));
        });

        ls.on('exit', function (code) {
            if(code=='0'){
                var result = tasksList.join().split('\n');
                if(result[result.length-1]==''){
                    result.pop();
                }
                dtd.resolve(result);
            }else{
                dtd.reject(errList);
            }
        });
        return dtd.promise();
    }
};

var conCon = {
    clearContent:function(){
        $('#gulpInfo').html('');
    },
    addContent:function(data){
        $("#gulpInfo").append('<div>'+data+'</div>');
    },
    runTasking:function(msg){
        $('#gulpInfo').html('<div>'+msg+'</div>');
    }
}

commonEmitter.addListener('PROJECT_CHANGE',function(project){
    tasksCon.flushTasks(project);
});

commonEmitter.addListener('CONSOLE_CLEAR',function(data){
    conCon.clearContent();
});

commonEmitter.addListener('CONSOLE_ADD_ROW',function(data){
    conCon.addContent(data);
});

commonEmitter.addListener('CONSOLE_RUNING',function(data){
    conCon.runTasking(data);
});


commonEmitter.addListener('ZERO_PROJECT',function(data){
    tasksCon.zeroTasks();
    conCon.clearContent();
});

projectsCon.init();
tasksCon.init();


