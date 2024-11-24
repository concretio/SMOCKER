import { AuthInfo, Connection } from '@salesforce/core';

async function orgAuthenticate(usernameOrAlias: string){
        const authInfo =await AuthInfo.create({username: usernameOrAlias});
        const connection = await authInfo.getConnection();
        return connection;
}

async function orgAuthenticateWithOAuth(){
    const authInfo = await AuthInfo.create({
        oauth2: { 
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            redirectUri: process.env.REDIRECT_URI,
        }
    });
    await authInfo.authenticate();
    const connection = await authInfo.getConnection();
    return connection
}