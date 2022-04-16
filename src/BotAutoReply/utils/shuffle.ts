export default function shuffle<T>(ar: T[]) {
    const arCopy = [...ar];

    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

    // eslint-disable-next-line guard-for-in
    for (let index = 0; arCopy.length > index; index++) {
        const r = arCopy.splice(random(0, arCopy.length), 1)[0];
        arCopy.splice(random(0, arCopy.length), 0, r);
    }

    return arCopy;
}
