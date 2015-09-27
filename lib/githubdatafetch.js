
var Promise = require("bluebird");
var github = require("./github");
var pullrequests = require("./pullrequests");
var trees = require("./trees");
var blobs = require("./blobs");
var builder = require("./builder");

github.onChangedPullRequests = function(prs){
    
    Promise.resolve(prs).map(function(pr){
        
        if (!pullrequests.isShaChanged(pr)){
            
            if (pullrequests.isChanged(pr)){
                pullrequests.save(pr);
                return;
            }
            
        }
        
        return UpdatePullRequest(pr).then(function(){
            pullrequests.save(pr);
            console.log("pr done -> " + pr.id + ":" + pr.title);
        });
        
    }, {"concurrency": 1});

};

function UpdatePullRequest(pullrequest){
    if (trees.contains(pullrequest.sha)){
        return Promise.resolve(trees.get(pullrequest.sha));
    }
    return github.getTree(pullrequest.repositoryName, pullrequest.sha)
        .then(saveTree)
        .then(function(tree) { return getBlobs(pullrequest.repositoryName, tree)})
        .then(function(tree) { return buildTree(tree)})
        //.then(saveTree)
       //.then(function(data){console.log(data);})
    
}

function saveTree(tree) {
    return Promise.resolve(trees.save(tree));
}

function getBlobs(repositoryName, tree) {
    
    var hasFailures = false;
    var promises = [];
    for (var path in tree.paths){
        (function(){  
            var sha = tree.paths[path];
            var tempPath = path;
            promises.push(blobs.contains(sha)
                .then(function(stat){
                    if (stat){
                        //console.log("return");
                        return;
                    }
                    
                    return github.getBlob(repositoryName,tree.sha,tempPath)
                        .then(function(source){
                            blobs.save(sha,source);
                        }).catch(function(err){
                            hasFailures = true;
                            console.error("repositoryName: " + repositoryName + " path: " + tempPath + " failed -> " + err);
                        });
                    
                }));
        
        })();

    }
    
    return Promise.all(promises)
        .then(function(a){
            if (hasFailures) {
                return Promise
                    .delay(1000)
                    .then(function(){
                        console.log("retrying...");
                        return getBlobs(repositoryName, tree);
                    });
            }
            return a;
        }).then(function() {return tree});
        
    
}

function buildTree(tree) {
    
    return builder.buildTree(tree);
    
    
}