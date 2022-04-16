const sleep = (delay: number) => new Promise((res) => { setTimeout(res, delay); });

export default sleep;
