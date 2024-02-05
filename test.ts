import { bench, run, group, baseline } from "mitata";

// group("mutating concat", () => {
//   baseline("spread push", () => {
//     const a = [1, 2, 3];
//     const b = [4, 5, 6];
//     a.push(...b);
//     // console.log("spread push", a);
//   });
//   bench("concat", () => {
//     const a = [1, 2, 3];
//     const b = [4, 5, 6];
//     const c = a.concat(b);
//     // console.log("concat", c);
//   });
//   bench("spread", () => {
//     // WINNER!
//     const a = [1, 2, 3];
//     const b = [4, 5, 6];
//     const c = [...a, ...b];
//     // console.log("spread", c);
//   });
//   bench("for loop", () => {
//     const a = [1, 2, 3];
//     const b = [4, 5, 6];
//     const c = [];
//     for (const x of a) {
//       c.push(x);
//     }
//     for (const x of b) {
//       c.push(x);
//     }
//     // console.log("for loop", c);
//   });
//   bench("mutating for loop", () => {
//     const a = [1, 2, 3];
//     const b = [4, 5, 6];
//     for (const x of b) {
//       a.push(x);
//     }
//     // console.log("mutating for loop", a);
//   });
// });

group("file io", () => {
  const file = Bun.file("data.txt");
  baseline("file.text()", async () => {
    const data = await file.text();
    for (const line of data.split("\n")) {
      line;
    }
  });
  bench("file.stream()", async () => {
    const stream = await file.stream();
    const decoder = new TextDecoder();
    for await (const chunck of stream) {
      const text = decoder.decode(chunck);
      for (const line of text.split("\n")) {
        line;
      }
    }
  });
});

run();
