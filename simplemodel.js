var SimpleModel = {
    'extend': function(object) {
        var model = {
            'instance': {
                'id': undefined,
                'url': '',
                'autopublish': true,
                'isnew': false,
                'methods': {
                    'create': '',
                    'save': '',
                    'delete': ''
                },
                'data': {},
                'required': [],
                'getField': function(name) {
                   SimpleLog.log('.'+this.id+'-'+name);
                    var f = jQuery('.'+this.id+'-'+name);
                    return f;
                },
                'publish': function() {
                    var required = this.required;
                    for(r in required) {
                        if(this.data[required[r]] === '' || this.data[required[r]] === undefined) {
                            var f = this.getField(required[r]).addClass('required-error');
                            ret = false;
                        } else {
                            this.getField(required[r]).removeClass('required-error');
                        }
                    }
                    if(!ret)
                        return ret;
                    if(this.beforePublish !== undefined && jQuery.isFunction(this.beforePublish))
                        if( !this.beforePublish(this.data) )
                            return;
                    var currentMethod = this.methods.save;
                    if( parseInt(this.data.id) === -1 || this.data.id === undefined){
                        currentMethod = this.methods.create;
                        this.isnew = true;
                    }
                    SimpleLog.log(this.data);
                    var self = this;
                    jQuery.post(
                        this.url+'/'+currentMethod,
                        this.data,
                        function() {
                        
                        },
                        "json"
                    )
                    .done(function(data) {
                        SimpleLog.log(data);
                        if(self.isnew && data.id !== undefined) {
                            self.isnew = false;
                            self.data.id = data.id;
                        }
                        if( self.done !== undefined && jQuery.isFunction(self.done))
                            self.done(data);
                    })
                    .fail(function() {
                        if( self.error !== undefined && jQuery.isFunction(self.error))
                            self.error();
                    });
                },
                'before': undefined,
                'done': undefined,
                'error': undefined
            },
            'init': function(data) {
                var selfModel = this;
                var d = new Date();
                d = d.getTime()/100000;
                d = ((d - parseInt(d))*100000)*parseInt(Math.random()*10);
                selfModel.instance.id = "m"+parseInt(d);
                SimpleLog.log(selfModel.instance.id);
                data.each(function () {
                    var input = jQuery(this);
                    input.addClass(selfModel.instance.id+'-'+input.attr('name'));
                    if( input.hasClass('ommit') ) return true;
                    if( input.attr('type') === "checkbox" || input.attr('type') === "radio" ) {
                        var group = jQuery("input[name='"+input.attr('name')+"']");
                        var i = 0;
                        input = jQuery('<input type="hidden" name="'+input.attr('name')+'" value="" />');
                        input.insertBefore(group);
                        group.each(function() {
                            var special = jQuery(this);
                            special.addClass('ommit');
                            special.attr('name', special.attr('name')+i);
                            special.change(function() {
                                if( this.checked ) {
                                    input.data( special.attr('name'), this.value );
                                } else {
                                    input.removeData( special.attr('name') );
                                }
                                input.val('');
                                var j = 0;
                                for( v in input.data() ) {
                                    var s = ',';
                                    if(j === 0)
                                        s = '';
                                    input.val(input.val()+s+input.data()[v]);
                                }
                                input.trigger('change');
                            });
                            if( special.attr('type') === 'checkbox' ) {
                                i++;
                            }
                        });
                        
                    }
                    selfModel.instance.data[input.attr("name")] = input.attr("value");
                    input.change( function() {
                        selfModel.instance.data[jQuery(this).attr('name')] = this.value;
                        if( selfModel.instance.autopublish )
                            selfModel.instance.publish();
                    });
                });
                return selfModel.instance;
            }
        };
        for( o in object ) {
            if(o === 'fields' || o === 'id') continue;
            model.instance[o] = object[o];
        }
        return model;
    }
};