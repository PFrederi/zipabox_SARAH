
  exports.action = function(data, callback, config, SARAH){


    // Retrieve config
  config = config.modules.zipabox;


  //Paramètre zipabox
  logoutURL = "user/logout";
  baseURL = config.api_web_adr;
  username = config.api_user;
  urlLight = "lights/";
  urlValues = "values/";
  initURL = "user/init";  
  
    var  http = require('http'),
    request = require('request'),
    crypto = require('crypto');
    var sessionid;
  

  
  
  if (!config.api_user || !config.api_secret){
    console.log("Missing Zipabox config");
	  callback({'tts' : 'Paramètre utilisiteur invalide'});
    return;
  }
  
    console.log('##### ZIPABOX #####');
//init1(baseURL+initURL, callback, config);
//console.log(sessionid);




//Commande recue du XML
switch (data.request)
	{
	case 'update': {
		console.log('##### UPDATE #####');
    init1(data, callback, config);
      }
  break;
  
  case 'set': {
  console.log('##### SET #####');
   init1(data, callback, config);
   
  }
  break;

	default:
	output(callback, "Une erreur s'est produite: ");
	}

}



//fonction courante
var sendURL = function(url, callback, cb){

  var request = require('request');
  request({ 'uri' : url }, function (err, response, body){
    
    if (err || response.statusCode != 200) {
      callback({'tts': "L'action a échoué"});
      return;
    }

    cb(body);
  });

}

//Mise à jour fichier XML
var update = function(jsonmodule, jsonscene, callback, config){
 
  console.log("***** UPDATE  *****");

  var fs   = require('fs');
  var file = config.rep_inst_sarah+'/plugins/zipabox/zipabox.xml';
  var xml  = fs.readFileSync(file,'utf8');
  
  var replace  = '§ -->\n';
  replace += '  <one-of>\n';
  

  //écriture des modules        
    for (var id in jsonmodule) {
      var module = id;
      

      replace += '    <item>'+jsonmodule[id]["name"]+'<tag>out.action.typ="modules";out.action.uuid="'+id+'";out.action.attribute="'+jsonmodule[id]["attributes"]["11"]["id"]+'"</tag></item>\n';
      console.log('Module ajout de : ' + jsonmodule[id]["name"]);
            
    }

  //écriture des scènes
    replace += '<!--SCENES-->\n';

    for (var id in jsonscene) {
      var scenes = id;
      replace += '    <item>'+jsonscene[id]["name"]+'<tag>out.action.typ="scenes";out.action.uuid="'+id+'"</tag></item>\n';
      console.log('Scene ajout de : ' + jsonscene[id]["name"]);    
    }
           

	console.log('ajout terminé');
  replace += '  </one-of>\n';
  replace += '<!-- §';
            
  var regexp = new RegExp('§[^§]+§','gm');
  var xml    = xml.replace(regexp,replace);
  fs.writeFileSync(file, xml, 'utf8');
  fs.writeFileSync(file, xml, 'utf8');
  
  callback({ 'tts' : 'mise a jour de la base terminée'});

}


//set pour Modules et Scenes
var setok = function (data, callback, config) {

  var requestset = require('request');
  console.log('session id' +sessionid);

  switch (data.typ)
              {
                case 'modules': {
                  var options1 = {
                  url: baseURL+'lights/'+data.uuid+'/attributes/'+data.attribute+'/value?JSESSIONID='+sessionid,
                  method: 'POST',
                  body : data.p_body
                   };
                }
                break;
                case 'scenes':{
                  var options1 = {
                  url: baseURL+'scenes/'+data.uuid+'/run?JSESSIONID='+sessionid,
                  method: 'POST'
                   };
                }
                break;
                default:
                output(callback, "Type non reconnu ");
              }
                
    requestset(options1, function (errorset, responseset, body) {
      if (!errorset && responseset.statusCode == 200) {
          output(callback, "fait");
      }
	  else output(callback, "Une erreur s'est produite dans le set");
    });
}

var init1 = function function_name (data, callback, config) {
  var request = require('request');
  var crypto = require('crypto');
  if(typeof sessionid === 'undefined') { //on vérifie qu'on est authentifié à la zipabox. Ligne à supprimée pour une identification à chaque commande.
  // sinon initialisation pour recuperation du nonce
      
      request(baseURL+initURL, function ( err, response, body){
    
      if (err || response.statusCode != 200) {
        callback({'tts': "L'initialisation a échouée"});
        return;
      }
    
      var json= JSON.parse(body);
        api_nonce = json.nonce;
        sessionid = json.jsessionid;
        console.log("nonce obtenu : " +api_nonce);
        console.log("Session :"+sessionid);
       
       //Génération du token de connection suivant l'algorythme : token = SHA1(nonce + SHA1(password))
        sh_login = api_nonce + crypto.createHash('sha1').update(config.api_secret).digest('hex');
        api_token =  crypto.createHash('sha1').update(sh_login).digest('hex');
        console.log("Api_token :"+api_token);

       request(baseURL+'user/login?username='+config.api_user+'&token='+api_token, function ( err, response, body2){    
          if (err || response.statusCode != 200) {
          output(callback, "L'action a échoué ");
          return;
          }
          //connection à la ZIPABOX
            var donnees = JSON.parse(body2);  
            sessionid = donnees.jsessionid;
            api_nonce = donnees.nonce;
            console.log("Connection à la zipabox réussie session :"+sessionid);

            switch (data.request)
              {
                case 'set': {
                  return setok(data,callback,config); 
                }
                break;
                case 'update': {
                  sendURL(baseURL+urlLight, callback, function(body3) {
                    var modules = JSON.parse(body3);
                    sendURL(baseURL+"scenes/", callback, function(body4){
                      var scenes = JSON.parse(body4);
                      console.log(scenes);
                    
                    update(modules, scenes, callback, config);
                    });
                  });
                }
                break;
                default:
                output(callback, "Une erreur s'est produite: ");
              }
        });      
  }); 
  
 } else //Début de partie à supprimée pour identification à chaque commande
 switch (data.request)
              {
                case 'set': {
                  return setok(data,callback,config); 
                }
                break;
                case 'update': {
                  sendURL(baseURL+urlLight, callback, function(body3) {
                    var modules = JSON.parse(body3);
                    sendURL(baseURL+"scenes/", callback, function(body4){
                      var scenes = JSON.parse(body4);
                      console.log(scenes);
                    
                    update(modules, scenes, callback, config);
                    });
                  });
                }
                break;
                default:
                output(callback, "Une erreur s'est produite: ");
              } //fin de partie à supprimer pour identification à chaque commande
    
}

var output = function ( callback, output ) {
	console.log(output);
	callback({ 'tts' : output});
}




