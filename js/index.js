var filePath = "/var/www/myweb/gulp_auto_build_demo/gulpfile.js";
var readline = require('readline');
var projectPath = "/var/www/myweb/gulp_auto_build_demo";
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
        this.currentProject = this.projectData['projects'][index];
        this.projectData['current'] = this.currentProject['name'];
        commonEmitter.emit("PROJECT_CHANGE",this.currentProject);
        this.writeData();
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
        if(!sameNameProject){
            console.log("已有同名项目");
            return false;
        }
        projects.push({
            name:'',
            filePath:filePath,
            path:pt.dirname(filePath)
        });
        this.writeData();
        return true;
    },
    delProject:function(){

    },
    buildProjectList:function(){
        var projects =this.projectData["projects"];
        var projectsHtml = '';
        for(var i= 0,l=projects.length;i<l;i++){
            var active = '';
            if(projects[i]['name'] == this.projectData['current']){
                active = 'active';
                this.defaultIndex = i;
            }
            var projectHtml = '<li class="'+active+'"><a href="javascript:void(0);" data-path="'+projects[i]['path']+'" data-index="'+i+'">'+projects[i]['name']+'</a></li>';

            projectsHtml = projectsHtml+projectHtml;
        }
        $('#projectList').html(projectsHtml);
    },
    showAddDialog:function(){

    },
    hideDialog:function(){

    },
    bindEvent:function(){
        var _this = this;
        $('#projectList').on('click','a',function(ev){
            ev.preventDefault();
            var index = $(this).data('index');
            _this.openProject(index);
        });
        $('#addProject').on('click',function(ev){
            _this.showAddDialog();
        })

    },
    init:function(){
        this.buildProjectList();
        this.openProject(this.defaultIndex);
        this.bindEvent();
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
    flushProject:function(project){
        this.getTasks(projectPath).then(function(tasks){
            var tasksHtml = '';
            for(var i=0;i<tasks.length;i++){
                var taskHtml = '<li><a href="javascript:void(0);" data-name="'+tasks[i]+'">'+tasks[i]+'</a></li>';
                tasksHtml = tasksHtml+taskHtml;
            }
            tasksHtml +='';
            $('#gulpTaskList').html(tasksHtml);
        },function(){
            console.log(arguments);
        });
    }
};

var conCon = {
    bindEvent:function(){
        var _this = this;
        $('#gulpTaskList').on('click','a',function(ev){
            ev.preventDefault();
            var taskName = $(this).data('name');
            _this.runGulpTask([taskName],projectPath).then(function(results){
                console.log('end');
            },function(errRes){

            })
        });
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
        commonEmitter.emit('CONSOLE_CLEAR');
        help.emitLines(ls.stdout);
        ls.stdout.on('line',function(data){
            commonEmitter.emit('CONSOLE_ADD_ROW',data);
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

    init:function(){
        this.bindEvent();
    },
    clearContent:function(){
        $('#gulpInfo').html('');
    },
    addContent:function(data){
        $("#gulpInfo").append('<div>'+data+'</div>');
    }
}

commonEmitter.addListener('PROJECT_CHANGE',function(project){
    tasksCon.flushProject(project);
});

commonEmitter.addListener('CONSOLE_CLEAR',function(data){
    conCon.clearContent();
});

commonEmitter.addListener('CONSOLE_ADD_ROW',function(data){
    conCon.addContent(data);
});

projectsCon.init();
conCon.init();



var chooser = document.querySelector('#gulpfileInput');
chooser.addEventListener("change", function (evt) {
    apendText(this.value);
}, false);

function apendText(text) {
}