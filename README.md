simplemodel
===========

JS class for create a model and link inputs with the data contained in. This class allows the auto publish of the data by post.

Creating a new model:

var User = new SimpleModel(
    {
        'url': "/user",
        'actions': {
            'insert': 'add',
            'update': 'update'
        },
        'fields': {
            'id': {'required': true, 'default':-1},
            'username': {'required': true},
            'name': {'required': true},
            'lastname': {'required': true}
        }
    }
);
===========
Creating a new user:

var data = jQuery("#myContainer").find('.userFields');
var newUser = User.create(data, true);//The second argument allow the model to auto update
===========
Saving an instance
newUser.publish(true);//The argument true force the instance to validate the data
===========
Accessing to every instances of one model
var instances = User.instances;
===========
...to continue