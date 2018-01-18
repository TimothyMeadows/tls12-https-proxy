@ECHO OFF
GOTO passphrase

:passphrase
ECHO The proxy will need the password for the certificate you are using.
ECHO.
SET /P passphrase=Passphrase: 
ECHO.
GOTO port

:port
ECHO What port would you like the proxy to run on?
ECHO Note: Any port below 1024 will require admin!
ECHO.
SET /P port=Port: 
ECHO.
GOTO key

:key
ECHO Please enter a key you would like to use. More can be entered into the config.json file later.
ECHO.
SET /P key=Key: 
ECHO.
GOTO save

:save
ECHO { "port": "%port%", "passphrase": "%passphrase%", "verbose": true, "keys": ["%key%"] } > config.json
GOTO install

:install
npm install
@ECHO ON