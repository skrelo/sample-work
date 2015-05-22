<?php

/**
 * controllers/RpcController.php
 * Set up and initialize the XML-RPC server
 * @author skrelo@gmail.com
 * 
 */


class RpcController extends Zend_Controller_Action
{
	protected $_server;
	public $params;
	public $baseUrl;
	
	/**
	* @property RPClasses - define catches for rpc instantiation
	*/
	public static $RPClasses = array(
		'sandbox' => 'App_Sandbox',
		'transaction' => 'App_Transaction',
		"admin" => "App_Admin",
	);
	
	/**
	* Setup XML-RPC Json Server
	*/
	public function init() {
		$this->_server = new Zend_Json_Server();
		$this->params = $this->_request->getParams();
		$this->baseUrl = $this->view->baseUrl();
	}
	
	/**
	* @method Index 
	* If no path is specified, return nothing
	*/
	public function indexAction(){ } 
	    
	/**
	* @method Call
	* 
	* return callable methods of RPC class to application (jQuery)
	* uses jquery.zend.rpc.js
	*/
    public function callAction() {
    	if (false == array_key_exists('id', $this->params)
    		|| false == array_key_exists($this->params['id'], self::$RPClasses)) 
    	{
    		die ('Invalid RPC Call Request');
    	}
    	
		// Do not process layout - this is an XMLHttpRequest
    		$this->_helper->layout->disableLayout();
			
		// Do not render view
		$this->_helper->viewRenderer->setNoRender();	
    	
		// is request is a get, return the RPC class methods
	    	if ($this->_request->isGet()) {
	    		$target = $this->baseUrl .'/rpc/call/id/'. $this->params['id'];
	
		    	$this->_server->setTarget($target)
		    		->setClass(self::$RPClasses[$this->params['id']])
		    		->setEnvelope(Zend_Json_Server_Smd::ENV_JSONRPC_2);
		    		
		    		// Switching to JSON RPC 2
		    		//->setEnvelope(Zend_Json_Server_Smd::ENV_JSONRPC_1);
		    		
		    	$this->_response->setHeader('Content-Type', 'application/json')
		    		->appendBody($this->_server->getServiceMap())
		    		->sendResponse();
		    	exit;
	    	}
    	
		// Set RPC class to server config
	    	$this->_server->setClass(self::$RPClasses[$this->params['id']]);
			$this->_server->handle();
			exit;
    }
}

