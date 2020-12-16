const strip = (string) => {
  return string.replace('роки', '')
    .replace('років', '')
    .replace('жінки', '')
    .replace('чоловіки', '')
    .replace('старше', '')
    .replace('(', '')
    .replace(')', '');
}

const parseReference = (reference) => {
  const refs = reference.toLowerCase().split('\n');
  const refRange = [];
  refs.forEach((ref, index) => {
    const refR = {};

    if (ref.includes('жінки')) {
      refR.appliesTo = 'Female';
    } else if (ref.includes('чоловіки')) {
      refR.appliesTo = 'Male';
    }

    if (ref.split(':').length > 1 && ref.split(':')[1].includes('-')) {
      const [rawLow, rawHigh] = ref.split(':')[1].split('-');
      refR.low = Number(rawLow);
      refR.high = Number(rawHigh);
    } else if (ref.split(':').length > 1 && ref.split(':')[1].includes('до')) {
      const high = Number(ref.split(':').length > 1 && ref.split(':')[1].replace('до', ''));
      refR.low = 0;
      refR.high = high;
    } else {
      return
    }

    if (ref.includes('жінки:')) {
      refR.age = {
        low: 18,
        high: 120
      }
      refRange.push(refR)
    } else if (ref.includes('чоловіки:')) {
      refR.age = {
        low: 18,
        high: 120
      }
      refRange.push(refR)
    }

    if (ref.includes('дорослі') && ref.split(':')[1]) {
      refR.age = {
        low: 18,
        high: 120
      }
      refRange.push(refR)
    } else if (ref.includes('старше')) {
      if (refs[index + 1].includes('дорослі:')) {
        const lowAge = Number(ref.split(':')[0].replace('старше', '').replace('років', ''));
        refR.age = {
          low: lowAge ? lowAge : 0,
          high: 18
        }
      } else {
        const lowAge = Number(strip(ref.split(':')[0]));
        refR.age = {
          low: lowAge,
          high: 120
        }
      }
      refRange.push(refR)
    } else if (ref.split(':')[0].includes('-') && (ref.includes('роки') || ref.includes('років'))) {
      const [rawLowAge, rawHighAge] = strip(ref.split(':')[0]).split('-');
      refR.age = {
        low: Number(rawLowAge),
        high: Number(rawHighAge)
      }
      refRange.push(refR)
    }
  })
  return refRange;
}

module.exports = {
  parseReference
}

