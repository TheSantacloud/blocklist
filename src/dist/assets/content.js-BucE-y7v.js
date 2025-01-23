function o(t,n){return`
    <html>
    <body style="background-color: black; color: white;">
        <div style="max-width: fit-content; margin-left: auto; margin-right: auto; margin-top: 10em; font-weight: 400; letter-spacing: 0.3em; font-family: Verdana, sans-serif;">
            <h1>
                ${t} blocked
            </h1>
        </div>
        <p style="width: 50%; max-width: fit-content; margin-left: auto; margin-right: auto; margin-top: 2em; font-style: italic; font-family: Verdana, sans-serif;">
           ${n}
        </p>
    </body>
    </html>
    `}function i({url:t,message:n}){const e=o(t,n);document.open(),document.write(e),document.close()}chrome.runtime.onMessage.addListener(function(t){t.action==="block-url"&&i(t)});
