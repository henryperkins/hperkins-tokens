function getHeaderMediaFeatures( viewport, { reducedMotion = false } = {} ) {
	const features = viewport.width >= 782
		? [
			{ name: 'hover', value: 'hover' },
			{ name: 'pointer', value: 'fine' },
		]
		: [];

	if ( reducedMotion ) {
		features.push( { name: 'prefers-reduced-motion', value: 'reduce' } );
	}

	return features;
}

module.exports = {
	getHeaderMediaFeatures,
};
