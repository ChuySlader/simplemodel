simplemodel
===========

JS class for create a model and link inputs with the data contained in. This class allows the auto publish of the data by post.

Creating a new model:

var User = SimpleModel.extend(
    {
        'url': "/myUrl",
        'methods': {
            'create': 'add', //The method to create a new user
            'save': 'update' //Method to update a user
        },
        'data': { 
            'id': -1,
            'username': '',
            'name': '',
            'password'
        },
        'required': [
            'username',
            'password'
        ],  
    }
);

Creating a new user:

var data = jQuery("#myContainer").find('.userFields');
var newUser = User.init(data);

...to continue