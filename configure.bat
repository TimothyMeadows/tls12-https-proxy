@ECHO OFF
GOTO passphrase

:passphrase
ECHO The proxy will need the password for the certificate you are using.
SET /P passphrase=Passphrase: 
GOTO port

:port
ECHO What port would you like the proxy to run on?
ECHO Note: Any port below 1024 will require admin!
SET /P port=Port: 
GOTO save

:save
ECHO { \"port\": \"%port%\", \"passphrase\": \"%passphrase%\" } > config.json
GOTO install

:install
npm install
GOTO end

:end
ECHO Configuration done. You can start the proxy with 'npm start' or 'node index'
PAUSE
@ECHO ON