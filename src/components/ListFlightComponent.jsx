import React, { useState } from 'react';
import { findLatestFplData, findLatestDepArrData, getDefaultSchema, findWindForIncidentRunway } from '../services/FlightService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ListFlightComponent = () => {
    const [searchFlightId, setSearchFlightId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [flightData, setFlightData] = useState(null);
    const [gufi, setGufi] = useState('');
    const [runway, setRunway] = useState('');
    const [windData, setWindData] = useState('');
    const [visibilityData, setVisibilityData] = useState('');
    const [isArrival, setIsArrival] = useState(false);
    const [isDeparture, setIsDeparture] = useState(false);

    const convertToLocalDateTime = (date) => {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    };

    const handleSubmitFpl = async (e) => {
        e.preventDefault();
        console.log('Aircraft Callsign:', searchFlightId);
        console.log('Selected Date and Time:', selectedDate);

        if (searchFlightId && selectedDate) {
            try {
                // Convert the selected date to ISO string, considering the local time zone offset
                const localDateTime = convertToLocalDateTime(selectedDate);
                const fplResponse = await findLatestFplData(searchFlightId, localDateTime);

                console.log('findLatestFplData Response:', fplResponse);

                if (fplResponse.data) {
                    setFlightData(fplResponse.data);
                    setGufi(fplResponse.data.gufi); // Store gufi

                    // After successfully fetching FPL data, fetch Departure/Arrival data using the same GUFI
                    const depArrResponse = await findLatestDepArrData(fplResponse.data.gufi);
                    console.log('findLatestDepArrData Response:', depArrResponse);

                    if (depArrResponse.data) {
                        // Merge the fetched departure/arrival data into the current flightData
                        setFlightData(prevData => ({
                            ...prevData,
                            departure: {
                                ...prevData?.departure,
                                actualTimeOfDeparture: depArrResponse.data.departure?.actualTimeOfDeparture || prevData?.departure?.actualTimeOfDeparture,
                                departureAerodrome: depArrResponse.data.departure?.departureAerodrome || prevData?.departure?.departureAerodrome
                            },
                            arrival: {
                                ...prevData?.arrival,
                                actualTimeOfArrival: depArrResponse.data.arrival?.actualTimeOfArrival || prevData?.arrival?.actualTimeOfArrival,
                                destinationAerodrome: depArrResponse.data.arrival?.destinationAerodrome || prevData?.arrival?.destinationAerodrome
                            }
                        }));
                    } else {
                        alert('No additional departure/arrival information found.');
                    }
                } else {
                    setFlightData(null);
                    setGufi(''); 
                    alert('Flight plan not found for given callsign and time. Please try again.');
                }
            } catch (error) {
                console.error('Error fetching flight plan or departure/arrival data:', error);
                alert('Error fetching flight plan or departure/arrival data.');
            }
        } else {
            alert('Please enter a valid callsign and incident time.');
        }
    };

    const handleViewSchema = async(e) => {
        e.preventDefault();

        try {
            const response = await getDefaultSchema();

            console.log('getDefaultSchema Response:', response);

            if (response.data) {
                alert('Loading default schema...');
                setFlightData(response.data);
            }
        } catch (error) {
            console.error('Error fetching default schema:', error);
            alert('Error fetching default schema.');
        }
    };

    function formatWithNewline(input) {
        if (typeof input === 'string') {
            return input.replace("Usage:", "<br/><br/>Usage:");
        }
        return input;
    }

    const handleWind = async (e) => {
        e.preventDefault();
    
        if (!selectedDate || !runway || !flightData) {
            alert('Please ensure the incident time is selected, runway is provided, and flight data is available.');
            return;
        }
    
        try {
            const localDateTime = convertToLocalDateTime(selectedDate);
    
            // Check if the flight is a departure or arrival at WSSS
            const isArrival = flightData.arrival?.destinationAerodrome === 'WSSS';
            const isDeparture = flightData.departure?.departureAerodrome === 'WSSS';

            setIsArrival(isArrival);
            setIsDeparture(isDeparture);
    
            // Call the third query, passing aerodrome information to determine the MET report
            const windResponse = await findWindForIncidentRunway(
                localDateTime,
                runway,
                flightData.arrival?.destinationAerodrome, // Pass destination aerodrome
                flightData.departure?.departureAerodrome  // Pass departure aerodrome
            );
            
            if (windResponse.data) {
                setWindData(windResponse.data.wind);  // Store the wind data for the specified runway
                console.log('Wind data:', windResponse.data.wind);
                setVisibilityData(windResponse.data.visibility);
                console.log('Visibility data:', windResponse.data.visibility);
            } else {
                alert('No wind data found for the specified runway.');
                setWindData(null);
            }

        } catch (error) {
            console.error('Error fetching wind data:', error);
            alert('Error fetching wind data.');
        }
    };

    function parseWindDetails(windString) {
        // Check if windString is valid (not undefined, not null, and not an empty object)
        if (!windString || windString === '{}' || windString === 'null') {
            return {};  // Return an empty object if the windString is not valid
        }
    
        // Proceed to parse the windString
        const parsed = windString
            .replace(/{|}/g, '')  // Remove curly braces
            .split(',')           // Split by commas to get individual key-value pairs
            .reduce((acc, item) => {
                const [key, value] = item.split('=');
                if (key && value) {  // Ensure key and value are valid
                    acc[key.trim()] = value.trim();  // Trim spaces and store key-value pair
                }
                return acc;
            }, {});
    
        return parsed;
    }  


    return (
        <div className='container' style={{ minHeight: '125vh', overflowY: 'auto' }}>
            <br />
            <h2 className='text-center'>Safety Incident Reporting Management System</h2>
            <br />
            
            <div className="row">
                <div className='mb-3 col-3' style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Enter Aircraft Callsign"
                        value={searchFlightId}
                        onChange={(e) => setSearchFlightId(e.target.value.toUpperCase())}
                        className="form-control"
                    />
                </div>
                <div className='mb-3 col-3' style={{ display: 'flex', alignItems: 'center' }}>
                    <DatePicker
                        selected={selectedDate}
                        onChange={date => setSelectedDate(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        placeholderText="Select Incident Time"
                        className="form-control"
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between mb-3">
                <button onClick={handleSubmitFpl} className='btn btn-primary'>Search</button>
                <button onClick={handleViewSchema} className='btn btn-secondary'>View Default Schema</button>
            </div>

            <br />
            <br />

            <h4>Flight Information</h4>
            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>EOBT</th>
                        <th>ATD</th>
                        <th>Departure Aerodrome</th>
                        <th>ATA</th>
                        <th>Arrival Aerodrome</th>
                        <th>Alternate Arrival Aerodrome</th>
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.departure?.estimatedOffBlockTime || 'N/A' 
                                    : flightData.departure?.estimatedOffBlockTime
                                    ? new Date(flightData.departure.estimatedOffBlockTime).toUTCString() 
                                    : 'N/A'
                                }
                            </td>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.departure?.actualTimeOfDeparture || 'N/A' 
                                    : flightData.departure?.actualTimeOfDeparture
                                    ? new Date(flightData.departure.actualTimeOfDeparture).toUTCString() 
                                    : 'N/A'
                                }
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.departure?.departureAerodrome || 'N/A') }}></td>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.arrival?.actualTimeOfArrival || 'N/A'
                                    : flightData.arrival?.actualTimeOfArrival
                                    ? new Date(flightData.arrival.actualTimeOfArrival).toUTCString() 
                                    : 'N/A'
                                }
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.arrival?.destinationAerodrome || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.arrival?.destinationAerodromeAlternate || 'N/A') }}></td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <br/>


            <h4>Other Information</h4>
            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}>
                <thead>
                    <tr>
                        <th>Callsign</th>
                        <th>Message Timestamp</th>
                        <th>Status</th>
                        <th>Registration</th>
                        <th>Operator</th>
                        <th>Aircraft Address</th>
                    </tr>
                </thead>
                <tbody>
                    {flightData && flightData.aircraft ? (
                        <tr>
                            
                            <td>{flightData.aircraftIdentification || 'N/A'}</td>
                            <td>
                                {flightData.gufi === 'defaultFpl'
                                    ? flightData.logTimestamp
                                    : new Date(flightData.logTimestamp).toUTCString() 
                                }
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.status || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.registration || 'N/A') }}></td>
                            <td>{flightData.operator || 'N/A'}</td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.aircraftAddress || 'N/A') }}></td>

                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>
           
            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>Aircraft Type</th>
                        <th>Aircraft Approach Category</th>
                        <th>Aircraft Wake Turbulence</th>
                        <th>Flight Rule</th>
                        <th>Flight Type</th>
                        <th>Originator</th>
        
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.aircraftType || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.aircraftApproachCategory || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.wakeTurbulence || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.filed?.routeInformation?.flightRulesCategory|| 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.flightType || 'N/A') }}></td>
                            <td>{flightData.gufiOriginator || 'N/A'}</td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>Communication Capability Code</th>
                        <th>Datalink Capability Code</th>
                        <th>Selective Calling Code</th>
                        <th>Navigation Capability Code</th>
                        <th>Performance Based Code</th>
                        <th>Surveillance Capability Code</th>
        
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.communication?.communicationCapabilityCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.communication?.datalinkCommunicationCapabilityCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.communication?.selectiveCallingCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.navigation?.navigationCapabilityCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.navigation?.performanceBasedCode || 'N/A') }}></td>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.aircraft?.capabilities?.surveillance?.surveillanceCapabilityCode || 'N/A') }}></td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <table className='table table-striped table-bordered' style={{ width: "100%", tableLayout: "fixed"}}> 
                <thead>
                    <tr>
                        <th>Route Information</th>  
                    </tr>
                </thead>
                <tbody>
                    {flightData ? (
                        <tr>
                            <td dangerouslySetInnerHTML={{ __html: formatWithNewline(flightData.filed?.routeInformation?.routeText|| 'N/A') }}></td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan="1" className="text-center">No data available yet</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <br/>


            <div>
                <h3>Information for Runway {runway}</h3>
                
                    <div className='mb-3 col-3' style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Enter Runway (e.g. 02L, 02C, 02R)"
                                value={runway}
                                onChange={(e) => { setRunway(e.target.value.toUpperCase()); }}
                                className="form-control"
                            />
                    </div>

                    <button onClick={handleWind} className='btn btn-primary'>
                        Search
                    </button>
            </div>
            <br/>

            
            <div>
            <h4>Wind Information</h4>
                {windData && windData[`RWY ${runway}`] ? (
                    <table className='table table-striped table-bordered'>
                        <thead>
                            <tr>
                                <th>Position</th>
                                <th>Wind Direction</th>
                                <th>Wind Speed</th>
                                <th>Wind Speed Unit</th>
                                <th>Variable Wind Direction</th>
                                <th>Variable Wind Speed</th>
                                <th>Variable Wind Speed Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* {windData[`RWY ${runway}`]?.end && (
                                <tr>
                                    <td>END</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.end)?.windDirection || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.end)?.windSpeed || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.end)?.windSpeedUnit || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.endVariableWind)?.variableWindDirection || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.endVariableWind)?.variableWindSpeed || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.endVariableWind)?.variableWindSpeedUnit || 'N/A'}</td>
                                </tr>
                            )} */}
                            {isDeparture && windData[`RWY ${runway}`]?.mid && (
                                <tr>
                                    <td>MID</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.mid)?.windDirection || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.mid)?.windSpeed || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.mid)?.windSpeedUnit || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.midVariableWind)?.variableWindDirection || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.midVariableWind)?.variableWindSpeed || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.midVariableWind)?.variableWindSpeedUnit || 'N/A'}</td>
                                </tr>
                            )}
                            {isArrival && windData[`RWY ${runway}`]?.tdz && (
                                <tr>
                                    <td>TDZ</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.tdz)?.windDirection || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.tdz)?.windSpeed || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.tdz)?.windSpeedUnit || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.tdzVariableWind)?.variableWindDirection || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.tdzVariableWind)?.variableWindSpeed || 'N/A'}</td>
                                    <td>{parseWindDetails(windData[`RWY ${runway}`]?.tdzVariableWind)?.variableWindSpeedUnit || 'N/A'}</td>
                                </tr>
                            )}
                            {}
                        </tbody>
                    </table>
                ) : (
                    <p>No wind data available for the specified runway.</p>
                )}
            </div>
            
            <br/>
            <div>
            <h4>Visibility Information</h4>
                {windData && windData[`RWY ${runway}`] ? (
                        <table className='table table-striped table-bordered'>
                            <thead>
                                <tr>
                                    <th>Position</th>
                                    <th>Visibility</th>
                                    <th>Visibility Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isDeparture && visibilityData[`RWY ${runway}`]?.mid && (
                                    <tr>
                                        <td>MID</td>
                                        <td>{parseWindDetails(visibilityData[`RWY ${runway}`]?.mid)?.visibility || 'N/A'}</td>
                                        <td>{parseWindDetails(visibilityData[`RWY ${runway}`]?.mid)?.visibilityUom || 'N/A'}</td>
                                    </tr>
                                )}
                                {isArrival && visibilityData[`RWY ${runway}`]?.tdz && (
                                    <tr>
                                        <td>TDZ</td>
                                        <td>{parseWindDetails(visibilityData[`RWY ${runway}`]?.tdz)?.visibility || 'N/A'}</td>
                                        <td>{parseWindDetails(visibilityData[`RWY ${runway}`]?.tdz)?.visibilityUom || 'N/A'}</td>                       
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <p>No visibility data available for the specified runway.</p>
                    )}
            </div>
        </div>
    );
}

export default ListFlightComponent;
