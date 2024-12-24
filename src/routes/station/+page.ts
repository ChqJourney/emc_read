import type { PageLoad } from '$types';

export const load: PageLoad = ({ url }) => {
	const stationId = url.searchParams.get('stationId');
	console.log(stationId);
	return {
	  stationId
	};
  };