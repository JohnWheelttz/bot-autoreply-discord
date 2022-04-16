export default function lucky(num: number): boolean {
    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

    const rgn = random(0, 101);

    if (num < rgn || num === 0) return false;
    return true;
}
