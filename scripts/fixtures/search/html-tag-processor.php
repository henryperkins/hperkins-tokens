<?php
/** Minimal public HTML Tag Processor shim for database-independent PHP tests. */
class WP_HTML_Tag_Processor {
	private $parts;
	private $index = -1;
	private $tag = '';

	public function __construct( $html ) {
		$this->parts = preg_split( '/(<[^>]+>)/', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
	}

	public function next_tag( $query = null ) {
		$wanted = is_string( $query ) ? $query : ( $query['tag_name'] ?? null );
		while ( ++$this->index < count( $this->parts ) ) {
			if ( ! preg_match( '/^<([a-z][a-z0-9-]*)\b/i', $this->parts[ $this->index ], $match ) ) {
				continue;
			}
			$this->tag = strtoupper( $match[1] );
			if ( $wanted && strtoupper( $wanted ) !== $this->tag ) {
				continue;
			}
			if ( is_array( $query ) && isset( $query['class_name'] ) && ! $this->has_class( $query['class_name'] ) ) {
				continue;
			}
			return true;
		}
		return false;
	}

	public function get_tag() {
		return $this->tag;
	}

	private function attribute_pattern( $name ) {
		return '/\s' . preg_quote( $name, '/' ) . '(?=\s|=|\/?\>)(?:\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+)))?/i';
	}

	public function get_attribute( $name ) {
		if ( ! preg_match( $this->attribute_pattern( $name ), $this->parts[ $this->index ], $match ) ) {
			return null;
		}
		if ( ! str_contains( $match[0], '=' ) ) {
			return true;
		}
		return html_entity_decode( $match[1] ?: ( $match[2] ?? '' ) ?: ( $match[3] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}

	public function has_class( $name ) {
		return in_array( $name, preg_split( '/\s+/', (string) $this->get_attribute( 'class' ) ), true );
	}

	public function set_attribute( $name, $value ) {
		$tag = $this->parts[ $this->index ];
		$attribute = ' ' . $name . '="' . htmlspecialchars( (string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) . '"';
		if ( null !== $this->get_attribute( $name ) ) {
			$this->parts[ $this->index ] = preg_replace_callback( $this->attribute_pattern( $name ), static function () use ( $attribute ) { return $attribute; }, $tag, 1 );
		} else {
			$this->parts[ $this->index ] = preg_replace( '/\/?\>$/', $attribute . '>', $tag );
		}
		return true;
	}

	public function get_updated_html() {
		return implode( '', $this->parts );
	}
}
