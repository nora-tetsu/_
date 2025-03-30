type OEmbedResponse = {
    version: string,
    type: string,
    provider_name: string,
    provider_url: string,
    url: string, //http://i.gyazo.com/8c9d9c8ec14dec4631b6ec77d1c85450_1.png,
    width: number,
    height: number,
}

export function getGyazoData(gyazoUrl: string) {
    return fetch(`https://api.gyazo.com/api/oembed?url=${gyazoUrl}`)
        .then(res => res.json()) as Promise<OEmbedResponse>
}
