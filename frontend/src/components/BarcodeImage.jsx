import React from 'react';

const BarcodeImage = ({ value, className = "" }) => {
    if (!value || value.length !== 13) return <div className="text-xs text-rose-500">Invalid EAN-13</div>;

    const L_CODE = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
    const G_CODE = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
    const R_CODE = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000110", "1001000", "1110100"];

    const STRUCTURE = [
        "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
        "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
    ];

    const firstDigit = parseInt(value[0]);
    const structure = STRUCTURE[firstDigit];
    const leftSide = value.slice(1, 7);
    const rightSide = value.slice(7, 13);

    let bits = "101"; // Left Guard

    // Encode Left Side
    for (let i = 0; i < 6; i++) {
        const digit = parseInt(leftSide[i]);
        const type = structure[i];
        bits += (type === 'L' ? L_CODE[digit] : G_CODE[digit]);
    }

    bits += "01010"; // Center Guard

    // Encode Right Side
    for (let i = 0; i < 6; i++) {
        const digit = parseInt(rightSide[i]);
        bits += R_CODE[digit];
    }

    bits += "101"; // Right Guard

    return (
        <div className={`flex flex-col items-center bg-white p-2 rounded-sm ${className}`}>
            <svg viewBox={`0 0 ${bits.length} 50`} className="w-full h-full" preserveAspectRatio="none">
                {bits.split('').map((bit, i) => (
                    bit === '1' && <rect key={i} x={i} y="0" width="1" height="50" fill="black" />
                ))}
            </svg>
            <div className="flex justify-between w-full text-[10px] font-mono mt-1 px-1 text-black">
                <span>{value[0]}</span>
                <span>{value.slice(1, 7)}</span>
                <span>{value.slice(7, 13)}</span>
            </div>
        </div>
    );
};

export default BarcodeImage;
