import axios from 'axios'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import PropTypes from 'prop-types'
import React from 'react'
import { feature, mesh } from 'topojson'
import { connect } from 'react-redux'
import lowerCase from 'lodash.lowercase'
import d3 from 'd3'


import { lookupStatesByRegion, lookupRegionByName } from '../util/location'

const Container = ({ children }) =>
  <div className="center bg-white rounded">
    <div className="aspect-ratio aspect-ratio--4x3">
      {children}
    </div>
  </div>

class StateCountyThumbnail extends React.Component {
  state = { usa: null, counties: null }
  componentDidMount() {
    axios.get('/data/us-albers-counties.json').then(response => {
      this.setState({ counties: response.data })
    })
    axios.get('/data/geo-usa-states.json').then(response => {
      this.setState({ usa: response.data })
    })
  }

  rememberValue = (name, fips) => e => {
      document.getElementById(fips).style.fill = '#f48e88'
  }

  forgetValue = fips => e => {
    if (document.getElementById(fips)) { document.getElementById(fips).style.fill = ''; }
  }

  render() {
    /* eslint-disable */
    const { coordinates, place, placeType, region, states, placeName } = this.props
    /* eslint-enable */
    const { usa, counties } = this.state

    if (!usa) return <Container />

    const [w, h] = [400, 300]
    const projection = geoAlbersUsa().scale(500).translate([w / 2, h / 2])
    const path = geoPath().projection(projection)
    const geoCounties = feature(counties, counties.objects.collection).features
    const meshedCounties = mesh(counties, counties.objects.collection, (a, b) => a !== b)

    const geoStates = feature(usa, usa.objects.units).features
    const meshedStates = mesh(usa, usa.objects.units, (a, b) => a !== b)

    const activeState = []
    const activeCounties = []

    // console.log('geoCounties:', geoCounties)

    if (place !== 'washington-dc') {
      if (place !== 'united-states') {
        activeState.push(geoStates.find(
          s => lowerCase(s.properties.name) === lowerCase(placeName),
        ))
      }
    } else {
      activeState.push(geoStates.find(s => s.id === 'US11'))
    }

    if (place !== 'washington-dc') {
      Object.keys(geoCounties).forEach(geo => {
        if (lowerCase(geoCounties[geo].properties.state) === lowerCase(placeName)) {
          activeCounties.push(geoCounties[geo])
        }
      })
    } else {
      activeCounties.push(geoStates.find(s => s.state === 'District of Columbia'))
    }

    // console.log('activeState:', activeState)
    // console.log('activeCounties:', activeCounties)


    const { lat, lng } = coordinates || {}
    const pin = coordinates && projection([lng, lat])

    let scale = 1
    let translate = [0, 0]
    let strokeWidth = 1
    if (activeState) {
      const bounds = path.bounds(activeState[0])
      const dx = bounds[1][0] - bounds[0][0]
      const dy = bounds[1][1] - bounds[0][1]
      const x = (bounds[0][0] + bounds[1][0]) / 2
      const y = (bounds[0][1] + bounds[1][1]) / 2
      scale = 1 / Math.max(dx / w, dy / h)
      // Increases Scale if Smaller State
      if (scale > 25) {
        scale = 0.2 / Math.max(dx / w, dy / h)
      }
      translate = [w / 2 - scale * x, h / 2 - scale * y]
      strokeWidth = 0.5 / scale
    }

    window.gs = geoStates

    const geoCountiesHtml = []
    activeCounties.map((d, i) => (
      geoCountiesHtml.push(<path
          id={`county-${d.properties.fips}`}
          key={`county-${i}-${d.properties.fips}`}
          d={path(d)}
          className="country fill-blue-light"
          stroke="#FFFFFF"
          strokeWidth={0.5}
          onMouseOver={this.rememberValue(d.properties.name, `county-${d.properties.fips}`)}
          onMouseMove={this.rememberValue(d.properties.name, `county-${d.properties.fips}`)}
          onMouseOut={this.forgetValue(`county-${d.properties.fips}`)}
        ><title>{d.properties.name}</title></path>)
    ))

    return (
      <Container>
        <svg
          className="aspect-ratio--object"
          preserveAspectRatio="xMidYMid"
          viewBox={`0 0 ${w} ${h}`}
        >
          <g
            strokeWidth={strokeWidth}
            transform={`translate(${translate})scale(${scale})`}
          >
            <g>
              {geoCountiesHtml}
              <path
                d={path(meshedStates)}
                fill="none"
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </svg>
      </Container>
    )
  }
}

StateCountyThumbnail.defaultProps = {
  coordinates: false,
}

StateCountyThumbnail.propTypes = {
  coordinates: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  place: PropTypes.string.isRequired,
  placeType: PropTypes.string.isRequired,
  states: PropTypes.object.isRequired,
  region: PropTypes.object.isRequired,
  placeName: PropTypes.string.isRequired,
}

const mapStateToProps = ({ filters, region, states }) => {
  const { place, placeType } = filters

  return {
    place,
    placeType,
    region,
    states,
  }
}

export default connect(mapStateToProps)(StateCountyThumbnail)